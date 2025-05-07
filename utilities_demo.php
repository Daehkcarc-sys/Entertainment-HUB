<?php
/**
 * Utilities Demo Page
 * This page demonstrates the use of the newly implemented PHP utility functions
 */

// Include necessary files
require_once 'api/db_config.php';
require_once 'api/utils.php';

// Set page title
$pageTitle = "PHP Utilities Demo";
$currentPage = "utilities";

// Start session and include header
session_start();
include 'api/header.php';

// Set up custom error handler
set_error_handler("custom_error_handler");

// Demo data for array operations
$movie_data = [
    ['id' => 3, 'title' => 'Inception', 'rating' => 8.8, 'year' => 2010],
    ['id' => 1, 'title' => 'The Dark Knight', 'rating' => 9.0, 'year' => 2008],
    ['id' => 5, 'title' => 'Interstellar', 'rating' => 8.6, 'year' => 2014],
    ['id' => 2, 'title' => 'Pulp Fiction', 'rating' => 8.9, 'year' => 1994],
    ['id' => 4, 'title' => 'The Matrix', 'rating' => 8.7, 'year' => 1999]
];

$tv_shows = [
    ['id' => 101, 'title' => 'Breaking Bad', 'rating' => 9.5, 'year' => 2008],
    ['id' => 102, 'title' => 'Game of Thrones', 'rating' => 9.3, 'year' => 2011]
];

// Create log entry for demo page access
log_to_file("Utilities demo page accessed by user ID: " . ($_SESSION['user_id'] ?? 'guest'), 'INFO');

// Initialize result storage
$results = [];
$errors = [];
?>

<div class="container section">
    <h1 class="page-title">PHP Utilities Demo</h1>
    <p class="lead">This page demonstrates various PHP utility functions implemented for the Entertainment Hub project.</p>

    <!-- Array Manipulation Section -->
    <section class="card mb-4">
        <div class="card-header">
            <h2>Array Manipulation Functions</h2>
        </div>
        <div class="card-body">
            <h3>Original Movie Data</h3>
            <pre class="code-block"><?php print_r($movie_data); ?></pre>

            <h3>1. Array Push Operation</h3>
            <?php
            // Demo of enhanced_array_push
            $new_movies = [
                ['id' => 6, 'title' => 'The Shawshank Redemption', 'rating' => 9.3, 'year' => 1994],
                ['id' => 7, 'title' => 'The Godfather', 'rating' => 9.2, 'year' => 1972]
            ];
            
            try {
                $count = enhanced_array_push($movie_data, ...$new_movies);
                $results['array_push'] = "Successfully added $count items to the movie array";
                echo "<div class='alert alert-success'>$results[array_push]</div>";
                echo "<pre class='code-block'>";
                print_r($movie_data);
                echo "</pre>";
            } catch (Exception $e) {
                $errors['array_push'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[array_push]</div>";
            }
            ?>

            <h3>2. Array Merge Operation</h3>
            <?php
            // Demo of enhanced_array_merge
            try {
                $media_collection = enhanced_array_merge(['type' => 'collection'], ['movies' => $movie_data], ['tvShows' => $tv_shows]);
                $results['array_merge'] = "Successfully merged arrays into a media collection";
                echo "<div class='alert alert-success'>$results[array_merge]</div>";
                echo "<pre class='code-block'>";
                // Just show a sample for brevity
                echo "Collection type: " . $media_collection['type'] . "\n";
                echo "Total movies: " . count($media_collection['movies']) . "\n";
                echo "Total TV shows: " . count($media_collection['tvShows']);
                echo "</pre>";
            } catch (Exception $e) {
                $errors['array_merge'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[array_merge]</div>";
            }
            ?>

            <h3>3. Array Sorting</h3>
            <?php
            // Demo of sort_array_by_key
            $sorted_movies = $movie_data;
            try {
                if (sort_array_by_key($sorted_movies, 'rating', 'DESC')) {
                    $results['array_sort'] = "Successfully sorted movies by rating (descending)";
                    echo "<div class='alert alert-success'>$results[array_sort]</div>";
                    echo "<pre class='code-block'>";
                    print_r($sorted_movies);
                    echo "</pre>";
                }
            } catch (Exception $e) {
                $errors['array_sort'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[array_sort]</div>";
            }
            ?>

            <h3>4. Array Schema Validation</h3>
            <?php
            // Demo of validate_array_schema
            $user_schema = [
                'id' => 'integer',
                'username' => 'string',
                'email' => 'string',
                'role' => 'string'
            ];
            
            $valid_user = [
                'id' => 123,
                'username' => 'johndoe',
                'email' => 'john@example.com',
                'role' => 'member'
            ];
            
            $invalid_user = [
                'id' => '123', // string instead of integer
                'username' => 'janedoe',
                'role' => 'admin'
                // missing email
            ];
            
            $valid_errors = validate_array_schema($valid_user, $user_schema);
            $invalid_errors = validate_array_schema($invalid_user, $user_schema);
            
            echo "<h4>Valid User Check:</h4>";
            if (empty($valid_errors)) {
                echo "<div class='alert alert-success'>User data is valid!</div>";
            } else {
                echo "<div class='alert alert-danger'>" . implode("<br>", $valid_errors) . "</div>";
            }
            
            echo "<h4>Invalid User Check:</h4>";
            if (empty($invalid_errors)) {
                echo "<div class='alert alert-success'>User data is valid!</div>";
            } else {
                echo "<div class='alert alert-danger'>" . implode("<br>", $invalid_errors) . "</div>";
            }
            ?>
        </div>
    </section>

    <!-- File Operations Section -->
    <section class="card mb-4">
        <div class="card-header">
            <h2>File Operations</h2>
        </div>
        <div class="card-body">
            <h3>1. Safe File Write</h3>
            <?php
            // Create a demo file
            $demo_content = "This is a demo file created at " . date('Y-m-d H:i:s') . "\n";
            $demo_content .= "It demonstrates the safe_file_write function from our utilities.\n";
            $demo_filepath = dirname(__FILE__) . '/logs/demo_file.txt';
            
            try {
                if (safe_file_write($demo_filepath, $demo_content)) {
                    $results['file_write'] = "Successfully wrote to file: $demo_filepath";
                    echo "<div class='alert alert-success'>$results[file_write]</div>";
                } else {
                    $errors['file_write'] = "Failed to write to file";
                    echo "<div class='alert alert-danger'>$errors[file_write]</div>";
                }
            } catch (Exception $e) {
                $errors['file_write'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[file_write]</div>";
            }
            ?>

            <h3>2. Safe File Read</h3>
            <?php
            // Read the demo file we just created
            try {
                $file_contents = safe_file_read($demo_filepath);
                if ($file_contents !== false) {
                    $results['file_read'] = "Successfully read from file";
                    echo "<div class='alert alert-success'>$results[file_read]</div>";
                    echo "<pre class='code-block'>" . htmlspecialchars($file_contents) . "</pre>";
                } else {
                    $errors['file_read'] = "Failed to read file";
                    echo "<div class='alert alert-danger'>$errors[file_read]</div>";
                }
            } catch (Exception $e) {
                $errors['file_read'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[file_read]</div>";
            }
            
            // Try to read a non-existent file
            $nonexistent_file = dirname(__FILE__) . '/logs/nonexistent_file.txt';
            echo "<h4>Attempting to read a non-existent file:</h4>";
            
            try {
                $file_contents = safe_file_read($nonexistent_file);
                if ($file_contents !== false) {
                    echo "<div class='alert alert-success'>Successfully read from file</div>";
                    echo "<pre class='code-block'>" . htmlspecialchars($file_contents) . "</pre>";
                } else {
                    echo "<div class='alert alert-warning'>File not found or not readable, but error was handled safely</div>";
                }
            } catch (Exception $e) {
                echo "<div class='alert alert-danger'>Error: " . $e->getMessage() . "</div>";
            }
            ?>

            <h3>3. Logging Function</h3>
            <?php
            // Test the logging function
            $log_message = "This is a test log message from the utilities demo page";
            
            try {
                if (log_to_file($log_message, 'DEBUG', 'demo.log')) {
                    $results['logging'] = "Successfully logged message to demo.log";
                    echo "<div class='alert alert-success'>$results[logging]</div>";
                    
                    // Read and display the log file
                    $log_file = dirname(__FILE__) . '/logs/demo.log';
                    if (file_exists($log_file)) {
                        $log_contents = safe_file_read($log_file);
                        echo "<h4>Contents of log file:</h4>";
                        echo "<pre class='code-block'>" . htmlspecialchars($log_contents) . "</pre>";
                    }
                } else {
                    $errors['logging'] = "Failed to log message";
                    echo "<div class='alert alert-danger'>$errors[logging]</div>";
                }
            } catch (Exception $e) {
                $errors['logging'] = "Error: " . $e->getMessage();
                echo "<div class='alert alert-danger'>$errors[logging]</div>";
            }
            ?>
        </div>
    </section>

    <!-- Error Handling Demo -->
    <section class="card mb-4">
        <div class="card-header">
            <h2>Error Handling</h2>
        </div>
        <div class="card-body">
            <h3>Custom Error Handler</h3>
            <p>The page is using a custom error handler that logs errors and displays user-friendly messages.</p>
            
            <h4>Trigger a sample notice:</h4>
            <?php
            // Demo error handling - uncomment to test
            // $undefined_var = $this_var_does_not_exist;
            ?>
            <div class="alert alert-info">This would trigger a notice if uncommented in the code. Check logs/errors.log for details.</div>
            
            <h4>Error Reporting Level:</h4>
            <pre class="code-block">Current error reporting level: <?= error_reporting(); ?></pre>
            
            <h4>Throw Exception Example:</h4>
            <?php
            try {
                // Example of throwing an exception
                if (date('N') > 5) { // If it's weekend
                    throw new Exception("It's the weekend! Take a break from coding.");
                } else {
                    echo "<div class='alert alert-info'>It's a weekday. Keep coding!</div>";
                }
            } catch (Exception $e) {
                echo "<div class='alert alert-warning'>Caught exception: " . $e->getMessage() . "</div>";
                log_to_file("Exception in utilities_demo.php: " . $e->getMessage(), 'WARNING');
            }
            ?>
        </div>
    </section>

    <!-- Email Function Demo -->
    <section class="card mb-4">
        <div class="card-header">
            <h2>Email Function</h2>
        </div>
        <div class="card-body">
            <h3>HTML Email Function</h3>
            <p>The <code>send_html_email()</code> function allows sending formatted HTML emails with proper headers and error handling.</p>
            
            <?php if (isset($_POST['send_test_email'])): ?>
                <?php
                $to = htmlspecialchars($_POST['email']);
                $subject = "Test Email from Entertainment Hub";
                $html_message = "
                    <html>
                    <head>
                        <title>Test Email</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; }
                            .container { max-width: 600px; margin: 0 auto; }
                            .header { background-color: #6c63ff; color: white; padding: 15px; text-align: center; }
                            .content { padding: 20px; border: 1px solid #ddd; }
                            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; color: #777; }
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Entertainment Hub</h1>
                            </div>
                            <div class='content'>
                                <h2>Hello there!</h2>
                                <p>This is a test email sent from the Entertainment Hub utilities demo page.</p>
                                <p>The email was sent at " . date('Y-m-d H:i:s') . "</p>
                                <p>This demonstrates the <code>send_html_email()</code> function with proper HTML formatting.</p>
                            </div>
                            <div class='footer'>
                                &copy; " . date('Y') . " Entertainment Hub. All rights reserved.
                            </div>
                        </div>
                    </body>
                    </html>
                ";
                
                $text_message = "Hello there!\n\nThis is a test email sent from the Entertainment Hub utilities demo page.\n\nThe email was sent at " . date('Y-m-d H:i:s') . "\n\nThis demonstrates the send_html_email() function.";
                
                if (send_html_email($to, $subject, $html_message, $text_message)) {
                    echo "<div class='alert alert-success'>Test email sent to $to</div>";
                } else {
                    echo "<div class='alert alert-danger'>Failed to send test email. Check logs for details.</div>";
                }
                ?>
            <?php else: ?>
                <form method="post" class="form">
                    <div class="form-group">
                        <label for="email">Send a test email to:</label>
                        <input type="email" name="email" id="email" class="form-control" required>
                        <small class="form-text text-muted">No actual email will be sent in this demo unless your server has mail configured.</small>
                    </div>
                    <button type="submit" name="send_test_email" class="btn btn-primary">Send Test Email</button>
                </form>
            <?php endif; ?>
        </div>
    </section>

    <!-- Summary Section -->
    <section class="card">
        <div class="card-header">
            <h2>Function Summary</h2>
        </div>
        <div class="card-body">
            <h3>Implemented Functions from Checklist:</h3>
            <ul class="list-group">
                <li class="list-group-item list-group-item-success">
                    <strong>Test Variables</strong>: isset(), empty() - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Error Handling</strong>: try/catch, throw, error_reporting - Enhanced with custom_error_handler()
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Script Termination</strong>: exit() - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Array Functions</strong>: count(), array_push(), array_merge(), sort() - Enhanced with custom implementations
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Form Handling</strong>: $_GET, $_POST - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Date Functions</strong>: strtotime(), time() - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>File Operations</strong>: fopen(), fclose(), fread(), fwrite(), fgets(), file_exists(), is_readable() - Enhanced with safe functions
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Sessions</strong>: session_start(), $_SESSION, session_destroy() - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>Email</strong>: mail() - Enhanced with send_html_email() function
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>SQL Queries</strong>: SELECT, UPDATE, INSERT, DELETE - Already present in codebase
                </li>
                <li class="list-group-item list-group-item-success">
                    <strong>PDO</strong>: setAttribute(), prepare(), execute(), closeCursor(), query() vs exec() vs prepare() - Already present in codebase
                </li>
            </ul>
        </div>
    </section>
</div>

<?php
// Restore default error handler
restore_error_handler();

// Include footer
include 'api/footer.php';
?>