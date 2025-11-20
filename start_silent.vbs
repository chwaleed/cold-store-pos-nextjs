Set WshShell = CreateObject("WScript.Shell")

' 1. Set the working directory to your project folder
WshShell.CurrentDirectory = "D:\Point-of-sales-Nextjs"

' 2. Run BUN completely invisible
' The "0" means hide window. "False" means don't wait for it to finish.
WshShell.Run "cmd /c bun run start", 0, False

' 3. Wait 5 seconds (5000 milliseconds) for the server to start
WScript.Sleep 5000

' 4. Open Chrome
WshShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:3000 --window-size=1024,768", 1, False

Set WshShell = Nothing