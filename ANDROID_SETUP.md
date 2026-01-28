# ?? Android Server Setup Guide

## Översikt
Din app har två delar:
- **Frontend (GitHub Pages):** HTML/CSS/JS som körs i webbläsaren
- **Backend (Android):** Node.js server + SQLite databas på din telefon

## ?? Arkitektur

```
???????????????????      HTTPS      ????????????????????
?  GitHub Pages   ? ???????????????? ? Android (Ngrok)  ?
?  (Frontend)     ?                  ?   Node.js API    ?
???????????????????                  ?   + SQLite DB    ?
                                     ????????????????????
```

## ?? Steg 1: Installera Termux på Android

1. **Ladda ner Termux** från F-Droid (rekommenderad) eller GitHub
   - F-Droid: https://f-droid.org/packages/com.termux/
   - GitHub: https://github.com/termux/termux-app/releases

2. **Öppna Termux** och uppdatera:
   ```bash
   pkg update && pkg upgrade
   ```

3. **Installera Node.js:**
   ```bash
   pkg install nodejs
   ```

4. **Verifiera installationen:**
   ```bash
   node --version
   npm --version
   ```

## ?? Steg 2: Överför Backend till Android

### Alternativ A: Via Git (Rekommenderad)

1. **Installera Git i Termux:**
   ```bash
   pkg install git
   ```

2. **Klona bara backend-filer:**
   ```bash
   cd ~
   git clone https://github.com/FeatureDev/Node_Android_project.git
   cd Node_Android_project
   ```

3. **Ta bort docs-mappen (frontend behövs inte på telefonen):**
   ```bash
   rm -rf docs
   ```

### Alternativ B: Via USB

1. **På din PC:**
   - Skapa en mapp `android-backend`
   - Kopiera följande filer:
     ```
     Server.js
     init-db.js
     package.json
     package-lock.json
     .gitignore
     ```

2. **Anslut telefon via USB**

3. **Kopiera mappen till telefon:** `/sdcard/Download/android-backend/`

4. **I Termux:**
   ```bash
   cd ~
   cp -r /sdcard/Download/android-backend ./mogges-store
   cd mogges-store
   ```

## ?? Steg 3: Installera Dependencies

```bash
npm install
```

Detta installerar:
- express
- sqlite3
- bcrypt
- express-session

## ?? Steg 4: Initiera Databasen

```bash
npm run init-db
```

Detta skapar:
- `moggesstore.db` med tabeller
- Admin-användare (admin / admin123)
- Testprodukter

## ?? Steg 5: Starta Servern

```bash
npm start
```

Du ska se:
```
? Server is running on http://0.0.0.0:3000
?? Access from network: http://<YOUR_PHONE_IP>:3000
```

## ?? Steg 6: Hitta Din Telefons IP-adress

**I Termux:**
```bash
ifconfig wlan0 | grep inet
```

**Eller:**
1. Gå till **Inställningar ? Wi-Fi**
2. Tryck på det anslutna nätverket
3. Hitta **IP-adress** (t.ex. `192.168.1.100`)

## ?? Steg 7: Exponera Servern med Ngrok

1. **Installera Ngrok i Termux:**
   ```bash
   pkg install wget unzip
   cd ~
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz
   tar xvzf ngrok-*.tgz
   chmod +x ngrok
   ```

2. **Logga in på Ngrok:**
   - Gå till https://ngrok.com/
   - Skapa gratis konto
   - Kopiera din authtoken

3. **Konfigurera Ngrok:**
   ```bash
   ./ngrok config add-authtoken DIN_AUTHTOKEN_HÄR
   ```

4. **Starta Ngrok:**
   ```bash
   ./ngrok http 3000
   ```

5. **Kopiera din Ngrok-URL** (t.ex. `https://abc123.ngrok-free.app`)

## ?? Steg 8: Uppdatera Frontend Config

1. **På GitHub:** Öppna `docs/js/config.js`

2. **Ändra Ngrok-URL:**
   ```javascript
   const CONFIG = {
       LOCAL_API: 'http://localhost:3000',
       PHONE_API: 'http://192.168.1.100:3000', // Din telefons IP
       NGROK_API: 'https://DIN-NGROK-URL.ngrok-free.app', // Din Ngrok URL
       MODE: 'ngrok' // Ändra till 'ngrok'
   };
   ```

3. **Commit och push:**
   ```bash
   git add docs/js/config.js
   git commit -m "Update API endpoint to Ngrok"
   git push
   ```

## ?? Steg 9: GitHub Pages Setup

1. **Gå till GitHub repository:**
   - Settings ? Pages

2. **Konfigurera:**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`

3. **Vänta några minuter**

4. **Din sida finns nu på:**
   ```
   https://featuredev.github.io/Node_Android_project/
   ```

## ?? Användning

### Starta Backend (Android)

1. **Öppna Termux**
2. ```bash
   cd ~/mogges-store
   npm start
   ```

3. **I nytt Termux-fönster (Session ? New session):**
   ```bash
   cd ~
   ./ngrok http 3000
   ```

### Testa Frontend (GitHub Pages)

1. **Öppna webbläsare**
2. **Gå till:** `https://featuredev.github.io/Node_Android_project/`
3. **Hemsidan laddar produkter från din Android-telefon!** ??

## ??? Felsökning

### Servern kan inte nås

**Problem:** Frontend kan inte ansluta till backend

**Lösning:**
1. Kontrollera att servern kör i Termux
2. Kontrollera att Ngrok kör
3. Kontrollera att `config.js` har rätt Ngrok-URL
4. Kontrollera CORS-inställningar i `Server.js`

### Ngrok-tunnel stängs

**Problem:** Ngrok-tunneln stängs efter inaktivitet

**Lösning:**
- Gratis Ngrok-konton har begränsad uptime
- Alternativ: Använd `phone` mode på samma WiFi

### Port redan används

**Problem:** `Error: listen EADDRINUSE: address already in use`

**Lösning:**
```bash
pkill -f node
npm start
```

## ?? Testning

### Testa Lokalt (Samma WiFi)

1. **Ändra `config.js`:**
   ```javascript
   MODE: 'phone'
   ```

2. **På din PC/telefon:**
   ```
   http://192.168.1.100:3000/api/products
   ```

### Testa via Ngrok (Internet)

1. **Ändra `config.js`:**
   ```javascript
   MODE: 'ngrok'
   ```

2. **Öppna GitHub Pages:**
   ```
   https://featuredev.github.io/Node_Android_project/
   ```

## ?? Säkerhet

?? **Viktigt för produktion:**

1. **Ändra session secret** i `Server.js`:
   ```javascript
   secret: 'ÄNDRA-TILL-STARK-HEMLIG-NYCKEL'
   ```

2. **Byt admin-lösenord:**
   - Logga in på `/index/admin.html`
   - Ändra lösenord

3. **Aktivera HTTPS:**
   - Ngrok ger automatiskt HTTPS
   - För produktion: Använd riktiga SSL-certifikat

## ?? Viktiga Kommandon

### Termux
```bash
# Starta server
npm start

# Stoppa server
Ctrl + C

# Se processer
ps aux | grep node

# Döda Node-process
pkill -f node

# Visa IP-adress
ifconfig wlan0 | grep inet

# Håll Termux vaken
termux-wake-lock

# Släpp wake-lock
termux-wake-unlock
```

### Ngrok
```bash
# Starta tunnel
./ngrok http 3000

# Starta med custom domain (betalversion)
./ngrok http --domain=ditt-namn.ngrok-free.app 3000

# Visa ngrok-dashboard
http://localhost:4040
```

## ?? Slutresultat

Nu har du:
- ? Frontend på GitHub Pages (gratis, alltid online)
- ? Backend på din Android-telefon
- ? Säker kommunikation via Ngrok HTTPS
- ? Kan utveckla och testa överallt!

---

**Lycka till!** ??

Om du får problem, kolla [NGROK_GUIDE.md](NGROK_GUIDE.md) för mer info.
