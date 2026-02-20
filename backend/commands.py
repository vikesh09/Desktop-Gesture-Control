import pyautogui
import os
import subprocess
import webbrowser
from datetime import datetime

from PIL import ImageGrab
def volume_up():
    pyautogui.press("volumeup")

def volume_down():
    pyautogui.press("volumedown")

def mute():
    pyautogui.press("volumemute")

def unmute():
    pyautogui.press("volumemute")

def play_media():
    pyautogui.press("playpause")

def pause_media():
    pyautogui.press("playpause")

def next_track():
    print(123)
    pyautogui.press("nexttrack")

def previous_track():
    pyautogui.press("prevtrack")

def screenshot():
    folder = os.path.join(os.path.expanduser("~"), "Pictures", "GestureShots")
    os.makedirs(folder, exist_ok=True)

    filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(folder, filename)

    img = ImageGrab.grab()

    try:
        img.save(path)
        print("Saved to:", path)
        print("Exists?", os.path.exists(path))
    except Exception as e:
        print("Error while saving:", e)

def lock_screen():
    os.system("rundll32.exe user32.dll,LockWorkStation")

def minimize_all_windows():
    pyautogui.hotkey("win", "d")

def maximize_current_window():
    pyautogui.hotkey("win", "up")

def minimize_current_window():
    pyautogui.hotkey("win", "down")
    
    
def new_tab():
    pyautogui.hotkey("ctrl", "t")

def close_tab():
    pyautogui.hotkey("ctrl", "w")

def reopen_closed_tab():
    pyautogui.hotkey("ctrl", "shift", "t")

def refresh_page():
    pyautogui.press("f5")

def scroll_up():
    pyautogui.scroll(600)

def scroll_down():
    pyautogui.scroll(-600)

def zoom_in():
    pyautogui.hotkey("ctrl", "+")

def zoom_out():
    pyautogui.hotkey("ctrl", "-")

def open_youtube():
    webbrowser.open("https://youtube.com")

def open_chatgpt():
    webbrowser.open("https://chat.openai.com")
    
def open_vscode():
    subprocess.Popen(["code", "."])

def open_terminal():
    subprocess.Popen("start cmd", shell=True)

def run_code():
    pyautogui.press("f5")

def git_pull():
    subprocess.run(["git", "pull"], shell=True)

def git_push():
    subprocess.run(["git", "push"], shell=True)

def create_html_template():
    folder = "HTML_Project"
    os.makedirs(folder, exist_ok=True)

    path = os.path.join(folder, "index.html")

    template = """<!DOCTYPE html>
<html>
<head>
  <title>New Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>"""

    with open(path, "w") as f:
        f.write(template)

def create_react_component():
    component_name = "NewComponent"
    filename = f"{component_name}.jsx"

    template = f"""import React from 'react';

const {component_name} = () => {{
  return (
    <div>
      <h1>{component_name}</h1>
    </div>
  );
}};

export default {component_name};
"""

    with open(filename, "w") as f:
        f.write(template)

def create_node_api_template():
    folder = "Node_API"
    os.makedirs(folder, exist_ok=True)

    path = os.path.join(folder, "server.js")

    template = """const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('API Running');
});

app.listen(3000, () => console.log('Server started'));
"""

    with open(path, "w") as f:
        f.write(template)

def create_readme():
    content = "# Project Title\n\n## Description\n\n## Installation\n\n## Usage\n"
    with open("README.md", "w") as f:
        f.write(content)
        
def create_new_folder():
    os.makedirs("New_Folder", exist_ok=True)

def rename_selected_file():
    pyautogui.press("f2")

def delete_selected_file():
    pyautogui.press("delete")

def open_downloads():
    os.startfile(os.path.join(os.path.expanduser("~"), "Downloads"))

def open_documents():
    os.startfile(os.path.join(os.path.expanduser("~"), "Documents"))

def open_desktop():
    os.startfile(os.path.join(os.path.expanduser("~"), "Desktop"))
    
def presentation_mode():
    pyautogui.press("f5")

def meeting_mode():
    mute()
    minimize_all_windows()
    webbrowser.open("https://zoom.us")

def study_mode():
    webbrowser.open("https://leetcode.com")
    open_vscode()

def focus_mode():
    subprocess.call("taskkill /f /im chrome.exe", shell=True)
    subprocess.call("taskkill /f /im spotify.exe", shell=True)