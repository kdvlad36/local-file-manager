const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { networkInterfaces } = require('os');
const openBrowser = require('open');

const app = express();
const port = 3001;

// Настройка директории для хранения файлов
const uploadFolder = process.env.FILE_TRANSFER_DIR || path.join(os.homedir(), 'file_transfer');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Получение всех IP-адресов сервера
function getIpAddresses() {
    const nets = networkInterfaces();
    const results = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Пропускаем non-IPv4 и локальные адреса
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    
    // Добавляем локальный адрес
    results.push('127.0.0.1');
    results.push('localhost');
    
    return results;
}

// Форматирование размера файла
function formatFileSize(size) {
    if (size < 1024) {
        return `${size} B`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`;
    } else {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
}

// Маршрут для главной страницы
app.get('/', (req, res) => {
    const files = fs.readdirSync(uploadFolder).map(file => {
        const filePath = path.join(uploadFolder, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            size: formatFileSize(stats.size),
            path: filePath
        };
    });
    
    const ipAddresses = getIpAddresses();
    
    const html = generateHTML(files, ipAddresses);
    res.send(html);
});

// Маршрут для загрузки файлов
app.post('/upload', upload.array('files'), (req, res) => {
    res.redirect('/');
});

// Маршрут для скачивания файлов
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadFolder, filename);
    res.download(filePath);
});

// Маршрут для удаления файлов
app.get('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadFolder, filename);
    
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    
    res.redirect('/');
});

// Генерация HTML-страницы
function generateHTML(files, ipAddresses) {
    return `
<!DOCTYPE html>
<html class="dark-theme">
<head>
    <title>Файловый менеджер</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --bg-color: #222222;
            --container-bg: #333333;
            --text-color: #e0e0e0;
            --border-color: #555555;
            --header-bg: #3a3a3a;
            --upload-bg: #1e3a5f;
            --info-bg: #3e3a1e;
            --info-border: #b28a00;
            --guide-bg: #1e3e2a;
            --guide-border: #2d6a34;
            --ip-bg: #444444;
            --shadow-color: rgba(0,0,0,0.5);
            --btn-download: #1a78c2;
            --btn-delete: #c13a2e;
            --btn-upload: #3a8c3a;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        html, body {
            font-family: Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
        }
        
        .container {
            max-width: 100%;
            padding: 15px;
            background-color: var(--container-bg);
            box-shadow: 0 2px 10px var(--shadow-color);
            min-height: 100vh;
        }
        
        h1, h2, h3 {
            margin: 15px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        th {
            background-color: var(--header-bg);
        }
        
        .upload-form {
            margin: 15px 0;
            padding: 15px;
            background-color: var(--upload-bg);
            border-radius: 5px;
        }
        
        .btn {
            display: inline-block;
            padding: 8px 12px;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            margin: 2px;
        }
        
        .btn-delete {
            background-color: var(--btn-delete);
        }
        
        .btn-download {
            background-color: var(--btn-download);
        }
        
        .btn-upload {
            background-color: var(--btn-upload);
        }
        
        .info-box {
            background-color: var(--info-bg);
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid var(--info-border);
        }
        
        .ip-address {
            font-family: monospace;
            background-color: var(--ip-bg);
            padding: 5px 10px;
            margin: 5px 2px;
            border-radius: 3px;
            display: inline-block;
            word-break: break-all;
        }
        
        .connection-guide {
            background-color: var(--guide-bg);
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid var(--guide-border);
        }
        
        input[type="file"] {
            margin: 10px 0;
            max-width: 100%;
        }
        
        /* Адаптация для мобильных устройств */
        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            
            h1 {
                font-size: 1.5rem;
            }
            
            table, tbody, tr, td, th {
                display: block;
            }
            
            table thead {
                display: none;
            }
            
            tr {
                margin-bottom: 15px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                padding: 5px;
                background-color: var(--container-bg);
            }
            
            td {
                padding: 8px;
                text-align: right;
                position: relative;
                padding-left: 120px;
                min-height: 40px;
            }
            
            td:before {
                content: attr(data-label);
                position: absolute;
                left: 8px;
                font-weight: bold;
            }
            
            .btn {
                display: block;
                margin: 5px 0;
                text-align: center;
                width: 100%;
            }
            
            .ip-address {
                display: block;
                width: 100%;
                text-align: center;
                overflow-wrap: break-word;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Файловый менеджер</h1>
        
        <div class="info-box">
            <h3>IP-адреса для доступа:</h3>
            <p>Для подключения с других устройств используйте:</p>
            ${ipAddresses.map(ip => `<div class="ip-address">http://${ip}:${port}</div>`).join(' ')}
        </div>
        
        <div class="upload-form">
            <h2>Загрузка файлов</h2>
            <form method="POST" action="/upload" enctype="multipart/form-data">
                <input type="file" name="files" multiple>
                <input type="submit" value="Загрузить" class="btn btn-upload">
            </form>
        </div>
        
        <h2>Список файлов</h2>
        ${files.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Имя файла</th>
                    <th>Размер</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => `
                <tr>
                    <td data-label="Имя файла">${file.name}</td>
                    <td data-label="Размер">${file.size}</td>
                    <td data-label="Действия">
                        <a href="/download/${encodeURIComponent(file.name)}" class="btn btn-download">Скачать</a>
                        <a href="/delete/${encodeURIComponent(file.name)}" class="btn btn-delete" onclick="return confirm('Вы уверены?')">Удалить</a>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>Нет доступных файлов</p>'}
        
        <div class="connection-guide">
            <h3>Руководство по подключению:</h3>
            <ol>
                <li>Убедитесь, что устройства подключены к одной Wi-Fi сети</li>
                <li>Откройте один из адресов выше в браузере другого устройства</li>
                <li>При проблемах с подключением проверьте настройки брандмауэра</li>
            </ol>
        </div>
    </div>
</body>
</html>
    `;
}

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
    console.log(`Файловый менеджер запущен на порту ${port}`);
    console.log(`Папка для обмена файлами: ${uploadFolder}`);
    console.log('Доступные IP-адреса:');
    getIpAddresses().forEach(ip => {
        console.log(`http://${ip}:${port}`);
    });
    console.log('Откройте браузер и перейдите по адресу: http://localhost:3001');
}); 