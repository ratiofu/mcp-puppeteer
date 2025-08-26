/**
 * HTML fixtures for testing interactive elements and navigation
 */

/**
 * Interactive HTML page with buttons, forms, and JavaScript for testing interactions
 */
export const interactiveHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Interactive Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { margin: 10px; padding: 10px 20px; }
        .result { margin: 10px 0; padding: 10px; background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>Interactive Test Page</h1>
    
    <button id="test-button" onclick="handleButtonClick()">Click Me</button>
    <button id="console-button" onclick="logToConsole()">Log to Console</button>
    <button id="error-button" onclick="throwError()">Throw Error</button>
    
    <div id="result" class="result">No actions performed yet</div>
    
    <form id="test-form" onsubmit="handleFormSubmit(event)">
        <input type="text" id="text-input" placeholder="Enter text" />
        <button type="submit">Submit Form</button>
    </form>
    
    <a href="/page2" id="navigation-link">Navigate to Page 2</a>
    
    <script>
        let clickCount = 0;
        
        function handleButtonClick() {
            clickCount++;
            document.getElementById('result').textContent = \`Button clicked \${clickCount} times\`;
            console.log(\`Button clicked \${clickCount} times\`);
        }
        
        function logToConsole() {
            console.log('Test log message');
            console.warn('Test warning message');
            console.error('Test error message');
            document.getElementById('result').textContent = 'Check console for log messages';
        }
        
        function throwError() {
            console.error('Intentional test error');
            throw new Error('This is a test error');
        }
        
        function handleFormSubmit(event) {
            event.preventDefault();
            const input = document.getElementById('text-input');
            document.getElementById('result').textContent = \`Form submitted with: \${input.value}\`;
            console.log(\`Form submitted with: \${input.value}\`);
        }
    </script>
</body>
</html>`

/**
 * Second page for navigation testing
 */
export const page2Html = `
<!DOCTYPE html>
<html>
<head>
    <title>Page 2</title>
</head>
<body>
    <h1>Page 2</h1>
    <p>This is the second page for navigation testing.</p>
    <a href="/" id="back-link">Back to Page 1</a>
    <script>
        console.log('Page 2 loaded');
    </script>
</body>
</html>`
