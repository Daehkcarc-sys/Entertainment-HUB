# Entertainment Hub 🎬

A comprehensive entertainment platform for discovering, tracking, and discussing movies, TV series, anime, manga, and games. Built with PHP, MySQL, and modern web technologies.

## 🌟 Features

### Core Features
- **Multi-Entertainment Platform**: Movies, TV series, anime, manga, and games all in one place
- **User Authentication**: Secure sign-up/sign-in system with session management
- **Content Discovery**: Browse and search across all entertainment categories
- **Rating & Reviews**: Rate and review your favorite content
- **Personal Watchlists**: Create and manage custom watchlists
- **Community Features**: Discussions, forums, and user interactions
- **Leaderboards**: Track top-rated content and active users
- **Interactive Quizzes**: Test your knowledge across different entertainment categories

### Advanced Features
- **Admin Panel**: Secure administrative interface for content and user management
- **Responsive Design**: Mobile-friendly interface with dark/light theme support
- **Real-time Updates**: Dynamic content loading and interactive components
- **Search & Filtering**: Advanced search capabilities with multiple filters
- **Social Features**: User profiles, friend systems, and community engagement
- **News & Events**: Stay updated with latest entertainment news and events
- **Personalized Recommendations**: AI-driven content suggestions based on user preferences

## 🛠️ Technology Stack

- **Backend**: PHP 8.x
- **Database**: MySQL 8.x
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Server**: Apache 2.4
- **Development Environment**: WAMP64
- **Libraries**: Font Awesome, Google Fonts
- **Security**: CSRF protection, SQL injection prevention, XSS protection

## 📋 Prerequisites

- WAMP64 (or XAMPP/LAMP equivalent)
- PHP 8.0 or higher
- MySQL 8.0 or higher
- Apache 2.4 or higher
- Modern web browser

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Daehkcarc-sys/Entertainment-HUB.git
cd Entertainment-HUB
```

### 2. Server Setup
1. Install WAMP64 if not already installed
2. Place the project folder in your WAMP `www` directory:
   ```
   C:\wamp64\www\Entertainment-HUB\
   ```

### 3. Database Setup
1. Start WAMP services (Apache & MySQL)
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database named `entertainment_hub`
4. Import the database schema:
   ```sql
   -- Use the schema provided in api/db_schema.sql
   ```
5. Run the setup script:
   ```bash
   php api/setup_sample_data.php
   ```

### 4. Configuration
1. Update database credentials in `api/db_config.php` if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'entertainment_hub');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Default for WAMP
   ```

2. Ensure proper file permissions are set for uploads and logs directories

### 5. Access the Application
- **Main Site**: http://localhost/Entertainment-HUB/
- **Admin Panel**: http://localhost/Entertainment-HUB/admin.php

## 🔐 Default Admin Credentials

For initial setup, use these default admin credentials:
- **Email**: admin@example.com
- **Password**: password
- **Admin Code**: 420

⚠️ **Important**: Change these credentials immediately after first login for security.

## 📁 Project Structure

```
Entertainment-HUB/
├── api/                    # Backend API and utilities
│   ├── admin_handler.php   # Admin API endpoints
│   ├── auth_handler.php    # Authentication logic
│   ├── db_config.php       # Database configuration
│   ├── db_schema.sql       # Database schema
│   ├── header.php          # Common header
│   ├── footer.php          # Common footer
│   └── utils.php           # Utility functions
├── css/                    # Stylesheets
│   ├── common.css          # Global styles
│   ├── admin.css           # Admin panel styles
│   ├── dark-theme.css      # Dark theme
│   └── [category].css      # Category-specific styles
├── js/                     # JavaScript files
│   ├── common.js           # Global JavaScript
│   ├── admin.js            # Admin panel functionality
│   └── [category].js       # Category-specific scripts
├── html/                   # Static HTML pages
├── images/                 # Media assets
├── uploads/                # User-uploaded content
├── logs/                   # Application logs
├── index.php               # Main entry point
├── admin.php               # Admin panel
├── signin.php              # Authentication page
└── README.md               # This file
```

## 🎯 Usage Guide

### For Users
1. **Sign Up**: Create an account on the sign-in page
2. **Explore**: Browse different entertainment categories
3. **Rate & Review**: Share your opinions on content
4. **Watchlist**: Track what you want to watch/read/play
5. **Community**: Join discussions and connect with other users
6. **Quizzes**: Test your entertainment knowledge

### For Admins
1. **Access Admin Panel**: Login with admin credentials
2. **User Management**: View and manage user accounts
3. **Content Moderation**: Review and moderate user-generated content
4. **Analytics**: View site statistics and user activity
5. **System Settings**: Configure site-wide settings

## 🔧 Development

### Adding New Features
1. **Database Changes**: Update `api/db_schema.sql`
2. **API Endpoints**: Add new handlers in `api/` directory
3. **Frontend**: Create corresponding HTML, CSS, and JS files
4. **Admin Interface**: Update admin panel if needed

### Code Style Guidelines
- Use consistent indentation (4 spaces)
- Follow PSR-12 coding standards for PHP
- Use meaningful variable and function names
- Add comments for complex logic
- Validate all user inputs
- Use prepared statements for database queries

## 🛡️ Security Features

- **SQL Injection Prevention**: All database queries use prepared statements
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF protection for forms
- **Session Security**: Secure session management with regeneration
- **Password Security**: Hashed passwords using PHP's password_hash()
- **Admin Protection**: Multi-layer admin authentication
- **Input Validation**: Server-side validation for all user inputs
- **File Upload Security**: Restricted file types and sizes

## 📊 Database Schema

The application uses the following main tables:
- `users`: User accounts and profiles
- `content`: Entertainment content (movies, anime, etc.)
- `reviews`: User reviews and ratings
- `watchlists`: User watchlist items
- `sessions`: User sessions
- `admin_logs`: Admin activity logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all security measures are maintained

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth_handler.php?action=login` - User login
- `POST /api/auth_handler.php?action=register` - User registration
- `POST /api/auth_handler.php?action=logout` - User logout

### Admin Endpoints
- `POST /api/admin_handler.php?action=login` - Admin login
- `GET /api/admin_handler.php?action=users` - Get user list
- `GET /api/admin_handler.php?action=stats` - Get dashboard statistics
- `POST /api/admin_handler.php?action=delete_user` - Delete user account

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check WAMP services are running
   - Verify database credentials in `db_config.php`
   - Ensure database exists and is accessible

2. **Permission Denied Errors**
   - Check file permissions on uploads and logs directories
   - Ensure Apache has read/write access to necessary folders

3. **Admin Panel Not Loading**
   - Verify admin credentials are correct
   - Check that admin user exists in database
   - Review server error logs

4. **CSS/JS Not Loading**
   - Clear browser cache
   - Check file paths in HTML
   - Verify Apache is serving static files correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Daehkcarc-sys** - *Initial work* - [Daehkcarc-sys](https://github.com/Daehkcarc-sys)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- WAMP team for development environment
- Community contributors and testers

## 📞 Support

For support, please:
1. Check the troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with detailed description
4. Contact the development team

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Advanced recommendation algorithms
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Enhanced admin analytics
- [ ] API for third-party integrations
- [ ] Real-time notifications
- [ ] Advanced search with AI
- [ ] Content streaming integration
- [ ] User-generated content moderation tools

---

**Entertainment Hub** - Your ultimate destination for all things entertainment! 🎬🎮📚
