import os

# Path to your HTML files and logo
html_directory = './'  # Assuming the HTML files are in the root folder
logo_path = 'images/logo.png'  # Path to the logo image

# HTML tag to insert for the logo
logo_tag = f'<img src="{logo_path}" alt="Logo" class="site-logo">'

# Function to insert logo in HTML files
def insert_logo_in_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Check if logo is already added
    if logo_tag not in content:
        # Insert logo at the top of the body or in a specific section
        content = content.replace('<body>', f'<body>\n  {logo_tag}')
        
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Logo added to {file_path}")
    else:
        print(f"Logo already present in {file_path}")

# Loop through all HTML files in the directory
for root, dirs, files in os.walk(html_directory):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            insert_logo_in_html(file_path)
