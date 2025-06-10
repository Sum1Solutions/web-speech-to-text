# Speech-to-Text Web Application

A modern, accessible, and production-ready speech-to-text application built with React and TypeScript. This application allows users to convert speech to text in real-time using the Web Speech API.

## Features

- 🎤 Real-time speech-to-text conversion
- 📋 Automatic clipboard copying
- 🔄 Robust continuous speech recognition with auto-restart for unexpected stops
- 🗣️ Voice commands support
- 🌙 Dark mode support
- ♿ Full accessibility support
- 🌐 TypeScript for enhanced type safety
- 🛡️ Error boundary for graceful error handling
- 📱 Responsive design

## Voice Commands

- Say "clear clear" to reset all transcriptions
- Say "stop listening" to pause speech recognition

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A modern web browser that supports the Web Speech API (Chrome recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sum1Solutions/web-speech-to-text.git
cd web-speech-to-text
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx    # Error handling component
│   └── SpeechToText.tsx     # Main speech-to-text component
├── hooks/
│   └── useSpeechRecognition.ts    # Custom hook for speech recognition
├── types/
│   └── web-speech-api.d.ts  # TypeScript definitions for Web Speech API
├── App.tsx
└── index.tsx
```

## ⚠️ Important Notice: Not HIPAA Compliant

**WARNING**: This application is NOT HIPAA compliant. Do not use it to process, store, or transmit any Protected Health Information (PHI) or other sensitive medical data. The application uses browser-based speech recognition and clipboard features that are not secured for medical data handling.

- Do not disclose any patient information
- Do not include any personal health information
- Use only for general, non-sensitive information
- Consider this tool as a general-purpose transcription utility only

## Technical Details

### TypeScript Integration

- Full TypeScript support with proper type definitions
- Custom type definitions for the Web Speech API
- Type-safe event handling and error management

### Custom Hook: useSpeechRecognition

The `useSpeechRecognition` hook encapsulates all speech recognition logic, providing:
- Type-safe speech recognition setup
- Error handling with detailed error messages
- Cleanup on component unmount
- Voice command processing
- Refactored to use refs for callbacks, ensuring stable operation and reliable voice command processing, especially with auto-restarts.

### Error Handling

- Comprehensive error boundary implementation.
- Detailed and actionable error messages for common issues, including:
  - Microphone access denied.
  - Network errors.
  - Browser compatibility issues (e.g., guidance for Microsoft Edge users to check OS language packs).
  - Recognition service errors (e.g., clarifying that the app will attempt to auto-restart after a `no-speech` event).

### Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Clear visual feedback
- Screen reader friendly
- High contrast mode support

## Future Enhancements

The robust continuous listening foundation of this application opens the door for several powerful future enhancements, turning it into a true ambient listening tool.

### Ambient Listening & Conversational AI

The current implementation provides a solid base for "always-on" ambient listening. The next steps will focus on transforming the captured text into structured, intelligent data.

- **Speaker Diarization**: To support conversations with multiple participants, we plan to integrate speaker diarization. This will involve identifying and labeling who is speaking at any given time, which is crucial for accurately transcribing meetings or consultations. This will likely require a more advanced, server-side speech processing service, as it's beyond the capabilities of the standard Web Speech API.

- **LLM Integration for Summarization & Analysis**: We plan to connect the transcribed text to a Large Language Model (LLM). This will unlock powerful features such as:
    - **Real-time Summarization**: Generating concise summaries of long conversations or dictations.
    - **Action Item Detection**: Identifying tasks, decisions, and follow-up items from the text.
    - **Structured Data Extraction**: Converting unstructured speech into structured formats (e.g., filling out a form from a conversation).

These enhancements will evolve the application from a simple speech-to-text utility into a powerful assistant for capturing and understanding spoken information.

## Browser Support

This application uses the Web Speech API, which has varying support across browsers:
- Chrome: Full support
- Edge: Full support
- Firefox: Partial support
- Safari: Limited support

For best results, use Google Chrome or Microsoft Edge.

## WinForms Integration

You can easily integrate this speech-to-text application into a WinForms application using the WebBrowser control. Here's how to set it up:

### Prerequisites
- .NET Framework 4.7.2 or later
- Visual Studio 2019 or later
- The speech-to-text app deployed and accessible via URL (e.g., http://localhost:3000)

### Implementation Steps

1. **Create a new WinForms Application** in Visual Studio

2. **Add a WebBrowser Control** to your form:
   - Open your form in the designer
   - Drag a `WebBrowser` control from the Toolbox
   - Set its `Dock` property to `Fill`
   - Set `ScriptErrorsSuppressed` to `true`
   - Set `ScrollBarsEnabled` to `false`

3. **Add a Button** to your form to trigger dictation

4. **Add this code to your form's code-behind**:

```csharp
using System;
using System.Windows.Forms;

namespace WinFormsDictationApp
{
    public partial class MainForm : Form
    {
        private bool isDictating = false;
        private const string DictationUrl = "http://localhost:3000";

        public MainForm()
        {
            InitializeComponent();
            webBrowser1.Navigate(DictationUrl);
            webBrowser1.Visible = false;
            webBrowser1.DocumentCompleted += WebBrowser_DocumentCompleted;
        }

        private void btnDictate_Click(object sender, EventArgs e)
        {
            isDictating = !isDictating;
            
            if (isDictating)
            {
                // Show the web browser in a popup or panel
                webBrowser1.Visible = true;
                btnDictate.Text = "Stop Dictation";
                
                // Focus the web browser to ensure it can capture keyboard events
                webBrowser1.Focus();
            }
            else
            {
                // Hide the web browser
                webBrowser1.Visible = false;
                btnDictate.Text = "Start Dictation";
                
                // Get the final transcription from the web app
                var script = "window.getTranscription();";
                var transcription = webBrowser1.Document.InvokeScript("eval", new object[] { script })?.ToString();
                
                // Use the transcription in your WinForms app
                MessageBox.Show($"Transcription complete:\n\n{transcription}", "Dictation Complete");
            }
        }

        private void WebBrowser_DocumentCompleted(object sender, WebBrowserDocumentCompletedEventArgs e)
        {
            // Inject JavaScript to expose a function that can be called from WinForms
            var script = @"
                window.getTranscription = function() {
                    const textarea = document.querySelector('textarea');
                    return textarea ? textarea.value : '';
                };
                
                // Listen for messages from the parent window
                window.addEventListener('message', function(event) {
                    if (event.data === 'getTranscription') {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                            window.external.CallScriptFunction(textarea.value);
                        }
                    }
                });
            ";
            
            var doc = webBrowser1.Document;
            var head = doc.GetElementsByTagName("head")[0];
            var scriptEl = doc.CreateElement("script");
            scriptEl.SetAttribute("type", "text/javascript");
            scriptEl.SetAttribute("text", script);
            head.AppendChild(scriptEl);
        }
    }
}
```

### Alternative: Using a Popup Form

For a better user experience, you might want to show the dictation interface in a popup form:

```csharp
private void ShowDictationPopup()
{
    var popup = new Form
    {
        Width = 400,
        Height = 600,
        StartPosition = FormStartPosition.CenterScreen,
        FormBorderStyle = FormBorderStyle.SizableToolWindow,
        Text = "Speech to Text"
    };

    var browser = new WebBrowser
    {
        Dock = DockStyle.Fill,
        ScriptErrorsSuppressed = true,
        ScrollBarsEnabled = false,
        Url = new Uri("http://localhost:3000")
    };

    popup.Controls.Add(browser);
    popup.ShowDialog();
    
    // Get the transcription after the popup is closed
    var script = "window.getTranscription();";
    var transcription = browser.Document?.InvokeScript("eval", new object[] { script })?.ToString();
    
    if (!string.IsNullOrEmpty(transcription))
    {
        // Use the transcription in your main form
        MessageBox.Show($"Transcription complete:\n\n{transcription}", "Dictation Complete");
    }
}
```

### Security Considerations

1. **CORS**: Ensure your web app allows embedding in iframes by setting the appropriate CORS headers:
   ```javascript
   // In your React app's server configuration
   app.use((req, res, next) => {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
     next();
   });
   ```

2. **HTTPS**: For production, use HTTPS to ensure secure communication between the WinForms app and the web app.

3. **Error Handling**: Add proper error handling for cases when the web app is not accessible.

### Next Steps

1. Deploy your speech-to-text app to a web server
2. Update the `DictationUrl` in the WinForms app to point to your deployed URL
3. Customize the UI to match your application's design
4. Add error handling for offline scenarios
5. Implement proper state management for the dictation session

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Uses the Web Speech API
- Styled with Tailwind CSS
