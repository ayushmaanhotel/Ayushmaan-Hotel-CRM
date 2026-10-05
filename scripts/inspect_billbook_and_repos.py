import os
import zipfile
import glob

apk_path = r"C:\Users\ayush\Downloads\Mobile Devices\BillBook.apk"
print("Checking APK:", apk_path)
if os.path.exists(apk_path):
    print("Found BillBook.apk, size:", os.path.getsize(apk_path))
    try:
        with zipfile.ZipFile(apk_path, 'r') as z:
            names = z.namelist()
            print(f"Total files in APK: {len(names)}")
            
            # Check architecture
            is_flutter = any('flutter' in n.lower() for n in names)
            is_react_native = any('react' in n.lower() or 'index.android.bundle' in n.lower() for n in names)
            is_cordova_cap = any('capacitor' in n.lower() or 'cordova' in n.lower() for n in names)
            
            print("Framework detection:")
            print(" - Flutter:", is_flutter)
            print(" - React Native:", is_react_native)
            print(" - Capacitor/Cordova:", is_cordova_cap)
            
            # Interesting asset or template files
            interesting = [n for n in names if any(k in n.lower() for k in ['pdf', 'invoice', 'template', 'bill', 'print', 'html', 'theme'])]
            print(f"\nMatching files ({len(interesting)} found, showing up to 50):")
            for item in interesting[:50]:
                print("  ", item)
    except Exception as e:
        print("Error opening zip:", e)
else:
    print("BillBook.apk not found at that exact path. Searching Downloads...")
    for f in glob.glob(r"C:\Users\ayush\Downloads\**\*bill*.apk", recursive=True):
        print("Found alternative:", f)

print("\n--- Searching for other projects on C:\\Users\\ayush ---")
search_roots = [
    r"C:\Users\ayush\Desktop",
    r"C:\Users\ayush\Downloads",
    r"C:\Users\ayush\Documents",
    r"C:\Users\ayush"
]

project_dirs = []
for root in [r"C:\Users\ayush", r"C:\Users\ayush\Desktop", r"C:\Users\ayush\Downloads"]:
    try:
        for entry in os.scandir(root):
            if entry.is_dir() and not entry.name.startswith('.'):
                # check if package.json or pubspec.yaml or build.gradle exists
                for marker in ['package.json', 'pubspec.yaml', 'build.gradle', 'pom.xml']:
                    if os.path.exists(os.path.join(entry.path, marker)):
                        project_dirs.append(entry.path)
                        break
    except Exception:
        pass

print("Found user projects:", project_dirs)

# Search specifically for PDF usage in found projects
for proj in project_dirs:
    pkg = os.path.join(proj, 'package.json')
    if os.path.exists(pkg):
        try:
            with open(pkg, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if any(k in content.lower() for k in ['pdf', 'jspdf', 'pdfmake', 'print', 'html2canvas']):
                    print(f"Project with PDF packages: {proj}")
                    for line in content.splitlines():
                        if any(k in line.lower() for k in ['pdf', 'jspdf', 'pdfmake', 'print', 'html2canvas']):
                            print("   ", line.strip())
        except Exception:
            pass
