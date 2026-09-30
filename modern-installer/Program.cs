using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media.Animation;
using Forms = System.Windows.Forms;

[assembly: AssemblyTitle("译澜安装器")]
[assembly: AssemblyDescription("译澜 v1.8.0 现代离线安装器")]
[assembly: AssemblyCompany("MOFAN")]
[assembly: AssemblyProduct("译澜")]
[assembly: AssemblyVersion("1.8.0.0")]
[assembly: AssemblyFileVersion("1.8.0.0")]

namespace YilanModernInstaller
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            try
            {
                Application application = new Application();
                application.ShutdownMode = ShutdownMode.OnMainWindowClose;
                InstallerController controller = new InstallerController();
                application.Run(controller.Window);
            }
            catch (Exception error)
            {
                string message = error.GetType().FullName + Environment.NewLine + error.Message;
                Exception inner = error.InnerException;
                while (inner != null)
                {
                    message += Environment.NewLine + inner.GetType().FullName + Environment.NewLine + inner.Message;
                    inner = inner.InnerException;
                }
                try { Console.Error.WriteLine(message); } catch { }
                try { MessageBox.Show(message, "译澜安装器启动失败", MessageBoxButton.OK, MessageBoxImage.Error); } catch { }
            }
        }
    }

    internal sealed class InstallerController
    {
        private const int FooterSize = 32;
        private const string FooterMagic = "YILANPAYLOAD180!";
        private bool installing;
        private string installedExecutable;

        public Window Window { get; private set; }
        private TextBox PathTextBox;
        private TextBlock TargetPreview;
        private Button BrowseButton;
        private Button InstallButton;
        private Button FinishButton;
        private Button CloseButton;
        private Button MinimizeButton;
        private Grid TitleBar;
        private Grid SetupPanel;
        private Grid ProgressPanel;
        private TextBlock ProgressTitle;
        private TextBlock ProgressStatus;
        private TextBlock ProgressGlyph;
        private TextBlock InstallLocationText;
        private ProgressBar InstallProgress;

        public InstallerController()
        {
            Window = LoadWindow();
            BindControls();
            WireEvents();
            PathTextBox.Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs");
            UpdateTargetPreview();
            Window.Loaded += delegate
            {
                Storyboard intro = Window.Resources["IntroStoryboard"] as Storyboard;
                if (intro != null) intro.Begin(Window);
            };
        }

        private static Window LoadWindow()
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream stream = assembly.GetManifestResourceStream("Yilan.InstallerWindow.xaml"))
            {
                if (stream == null) throw new InvalidOperationException("安装界面资源缺失。");
                return (Window)XamlReader.Load(stream);
            }
        }

        private void BindControls()
        {
            PathTextBox = Find<TextBox>("PathTextBox");
            TargetPreview = Find<TextBlock>("TargetPreview");
            BrowseButton = Find<Button>("BrowseButton");
            InstallButton = Find<Button>("InstallButton");
            FinishButton = Find<Button>("FinishButton");
            CloseButton = Find<Button>("CloseButton");
            MinimizeButton = Find<Button>("MinimizeButton");
            TitleBar = Find<Grid>("TitleBar");
            SetupPanel = Find<Grid>("SetupPanel");
            ProgressPanel = Find<Grid>("ProgressPanel");
            ProgressTitle = Find<TextBlock>("ProgressTitle");
            ProgressStatus = Find<TextBlock>("ProgressStatus");
            ProgressGlyph = Find<TextBlock>("ProgressGlyph");
            InstallLocationText = Find<TextBlock>("InstallLocationText");
            InstallProgress = Find<ProgressBar>("InstallProgress");
        }

        private T Find<T>(string name) where T : FrameworkElement
        {
            T result = Window.FindName(name) as T;
            if (result == null) throw new InvalidOperationException("界面控件缺失：" + name);
            return result;
        }

        private void WireEvents()
        {
            TitleBar.MouseLeftButtonDown += delegate(object sender, MouseButtonEventArgs args)
            {
                if (args.ButtonState == MouseButtonState.Pressed) Window.DragMove();
            };
            MinimizeButton.Click += delegate { if (!installing) Window.WindowState = WindowState.Minimized; };
            CloseButton.Click += delegate { if (!installing) Window.Close(); };
            PathTextBox.TextChanged += delegate { UpdateTargetPreview(); };
            BrowseButton.Click += BrowseForParent;
            InstallButton.Click += InstallClicked;
            FinishButton.Click += delegate
            {
                Window.Close();
            };
        }

        private void BrowseForParent(object sender, RoutedEventArgs args)
        {
            using (Forms.FolderBrowserDialog dialog = new Forms.FolderBrowserDialog())
            {
                dialog.Description = "选择译澜的父文件夹（可以选择磁盘根目录）";
                dialog.ShowNewFolderButton = true;
                if (Directory.Exists(PathTextBox.Text)) dialog.SelectedPath = PathTextBox.Text;
                if (dialog.ShowDialog() == Forms.DialogResult.OK) PathTextBox.Text = dialog.SelectedPath;
            }
        }

        private string ComputeTargetDirectory()
        {
            string parent = (PathTextBox.Text ?? string.Empty).Trim().Trim('"');
            if (parent.Length == 0) throw new InvalidOperationException("请选择安装位置。");
            string full = Path.GetFullPath(parent);
            string name = new DirectoryInfo(full).Name;
            if (string.Equals(name, "Yilan", StringComparison.OrdinalIgnoreCase) || name == "译澜") return full;
            return Path.Combine(full, "Yilan");
        }

        private void UpdateTargetPreview()
        {
            try { TargetPreview.Text = ComputeTargetDirectory(); }
            catch { TargetPreview.Text = "请选择有效的磁盘或文件夹"; }
        }

        private async void InstallClicked(object sender, RoutedEventArgs args)
        {
            string target;
            try { target = ComputeTargetDirectory(); }
            catch (Exception error)
            {
                MessageBox.Show(Window, error.Message, "译澜安装", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            installing = true;
            CloseButton.IsEnabled = false;
            MinimizeButton.IsEnabled = false;
            SetupPanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;
            InstallLocationText.Text = target;
            string temporaryInstaller = Path.Combine(Path.GetTempPath(), "Yilan-Setup-Core-" + Guid.NewGuid().ToString("N") + ".exe");

            try
            {
                SetProgress("正在准备安装", "正在读取完整离线组件…", 2, false);
                await ExtractPayloadAsync(temporaryInstaller);
                SetProgress("正在安装译澜", "正在部署模型、词典与推理后端…", 24, true);

                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = temporaryInstaller;
                startInfo.Arguments = "/S /currentuser /D=" + target;
                startInfo.UseShellExecute = true;
                startInfo.Verb = "runas";
                Process process = Process.Start(startInfo);
                if (process == null) throw new InvalidOperationException("无法启动安装核心。");
                await Task.Run(delegate { process.WaitForExit(); });
                if (process.ExitCode != 0) throw new InvalidOperationException("安装核心返回错误代码 " + process.ExitCode + "。");

                installedExecutable = Path.Combine(target, "Yilan.exe");
                if (!File.Exists(installedExecutable)) throw new InvalidOperationException("安装完成，但未找到主程序。");
                InstallProgress.IsIndeterminate = false;
                InstallProgress.Value = 100;
                ProgressGlyph.Text = "✓";
                ProgressTitle.Text = "安装完成";
                ProgressStatus.Text = "译澜已准备就绪，所有翻译组件均保存在本机。";
                FinishButton.Visibility = Visibility.Visible;
                CloseButton.IsEnabled = true;
                MinimizeButton.IsEnabled = true;
                installing = false;
            }
            catch (Exception error)
            {
                InstallProgress.IsIndeterminate = false;
                ProgressGlyph.Text = "!";
                ProgressTitle.Text = "安装未完成";
                ProgressStatus.Text = error.Message;
                CloseButton.IsEnabled = true;
                MinimizeButton.IsEnabled = true;
                installing = false;
            }
            finally
            {
                try { if (File.Exists(temporaryInstaller)) File.Delete(temporaryInstaller); } catch { }
            }
        }

        private void SetProgress(string title, string status, double value, bool indeterminate)
        {
            ProgressTitle.Text = title;
            ProgressStatus.Text = status;
            InstallProgress.Value = value;
            InstallProgress.IsIndeterminate = indeterminate;
        }

        private Task ExtractPayloadAsync(string destination)
        {
            return Task.Run(delegate
            {
                string self = Process.GetCurrentProcess().MainModule.FileName;
                using (FileStream input = new FileStream(self, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    if (input.Length < FooterSize) throw new InvalidDataException("安装包数据不完整。");
                    input.Seek(-FooterSize, SeekOrigin.End);
                    byte[] footer = new byte[FooterSize];
                    ReadExactly(input, footer, 0, footer.Length);
                    string magic = Encoding.ASCII.GetString(footer, 0, 16);
                    if (magic != FooterMagic) throw new InvalidDataException("安装包载荷校验失败。");
                    long offset = BitConverter.ToInt64(footer, 16);
                    long length = BitConverter.ToInt64(footer, 24);
                    if (offset < 0 || length <= 0 || offset + length + FooterSize != input.Length)
                        throw new InvalidDataException("安装包载荷范围无效。");
                    input.Seek(offset, SeekOrigin.Begin);
                    using (FileStream output = new FileStream(destination, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    {
                        byte[] buffer = new byte[4 * 1024 * 1024];
                        long copied = 0;
                        while (copied < length)
                        {
                            int wanted = (int)Math.Min(buffer.Length, length - copied);
                            int read = input.Read(buffer, 0, wanted);
                            if (read <= 0) throw new EndOfStreamException("安装包载荷提前结束。");
                            output.Write(buffer, 0, read);
                            copied += read;
                            double progress = 2 + (20.0 * copied / length);
                            Window.Dispatcher.BeginInvoke(new Action(delegate
                            {
                                InstallProgress.Value = progress;
                                ProgressStatus.Text = "正在准备离线安装组件 · " + Math.Round(100.0 * copied / length) + "%";
                            }));
                        }
                    }
                }
            });
        }

        private static void ReadExactly(Stream stream, byte[] buffer, int offset, int count)
        {
            while (count > 0)
            {
                int read = stream.Read(buffer, offset, count);
                if (read <= 0) throw new EndOfStreamException();
                offset += read;
                count -= read;
            }
        }

    }
}
