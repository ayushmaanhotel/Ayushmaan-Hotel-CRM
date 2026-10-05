import base64

with open('src/assets/invoice/ganesha.jpg', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

with open('src/assets/invoice/ganeshaData.ts', 'w', encoding='utf-8') as f:
    f.write('/* Licensed Ganesha Sacred Deity Artwork (66 KB Base64 Data URI) */\n')
    f.write(f'export const GANESHA_DATA_URL = "data:image/jpeg;base64,{b64}";\n')

print('Generated src/assets/invoice/ganeshaData.ts')
