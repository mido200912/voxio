import os

target_dir = r"c:\Users\mido2\Downloads\Aithor2\frontend\src"
old_urls = ["aithor1.app.vercel", "aisor1.app.vercel", "aisor1.vercel.app"]
new_url = "aithor1.vercel.app"

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith((".jsx", ".js", ".css", ".html")):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            new_content = content
            for old in old_urls:
                new_content = new_content.replace(old, new_url)
            
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated: {file}")
