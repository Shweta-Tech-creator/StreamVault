# StreamVault - Cloud Video Streaming Hub

StreamVault is a dynamic, full-stack video streaming cloud application developed as an AWS Cloud Case Study. The application transitions a static cloud landing page into an enterprise-grade cloud architecture connected to a live relational database (Amazon RDS MySQL).

## 🚀 Features
- **User Authentication**: Secure signup and login forms with hashed password security (`bcryptjs`).
- **Dynamic Stats Dashboard**: Real-time stats showing Total Users, Total Videos, Active Streams, and Storage Usage calculated directly from database tables.
- **Interactive Streaming Video Library**: Responsive card interface that plays media streams directly via an HTML5 modal video player.
- **RDS Database Table Viewer**: Live data table that displays registered users by fetching records from the MySQL database using a REST API.
- **Robust Mock Database Fallback**: A local in-memory mock engine that automatically runs if database credentials are not set, allowing local execution out-of-the-box.

---

## 📂 Project Structure
```text
StreamVault/
├── package.json          # Node.js dependencies & scripts
├── server.js             # Express application server & REST APIs
├── db.js                 # Database connection helper & local mock engine
├── schema.sql            # MySQL database schemas & initial seed data
├── .env.example          # Environment variables template
├── Dockerfile            # Container definition for Node.js app
├── public/               # Frontend client code
│   ├── index.html        # Styled user dashboard interface
│   ├── style.css         # Premium dark-blue themed stylesheet
│   └── app.js            # Frontend API consumer & page updates
└── scripts/
    ├── deploy.sh         # AWS EC2 deployment automation script
    └── backup.sh         # Automated backup helper script
```

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Setup environment variables**:
   Create a `.env` file in the root folder (or copy `.env.example`):
   ```ini
   PORT=3005
   # Leave DB_* empty to use the Mock Fallback, or configure RDS:
   DB_HOST=streamvaultdb.xxxxx.ap-south-1.rds.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your_rds_password
   DB_NAME=streamvaultdb
   ```
3. **Start the local server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3005](http://localhost:3005)** in your browser.

---

## ☁️ AWS Deployment Commands

### 1. Upload Project to EC2
```bash
scp -i streamvault-key.pem -r ../StreamVault ec2-user@<EC2-PUBLIC-IP>:~/
```

### 2. Configure environment on EC2
Create `~/StreamVault/.env` and add:
```ini
PORT=3000
DB_HOST=streamvaultdb.c5ygk2sao1j1.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=Streamvault2026
DB_NAME=streamvaultdb
DB_PORT=3306
```

### 3. Initialize RDS Schema & Seed Data
```bash
mysql -h <RDS-ENDPOINT> -u admin -pStreamvault2026 streamvaultdb < ~/StreamVault/schema.sql
```

### 4. Deploy using PM2
```bash
cd ~/StreamVault
npm install
sudo npm install -g pm2
pm2 start server.js --name "streamvault"
pm2 save
```

### 5. Redirect Port 80 to 3000
```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000
```
Your application will be live at: **`http://<EC2-PUBLIC-IP>/`**
