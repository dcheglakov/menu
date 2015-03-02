<?php
    $name = $_POST['name'];
    $message = $_POST['message'];
    $from = 'From: Old City'; 
    $to = 'dcheglakov@gmail.com'; 
    $subject = 'Обеды в Офис';

    $body = "From: $name\n Message:\n $message";
?>

<?php
if ($_POST['submit']) {
    if (mail ($to, $subject, $body, $from)) { 
        echo '<p>Сегодня ты не будешь голоден, мой друг!</p>'; 
    } else { 
        echo '<p>Oops! An error occurred. Try sending your message again.</p>'; 
    }
}
?>