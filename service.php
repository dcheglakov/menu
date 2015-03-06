<?php
    require 'lib/Slim/Slim.php';
    error_reporting(E_ALL);
    \Slim\Slim::registerAutoloader();
    $app = new \Slim\Slim();

    $app->get('/menu', function () {
        $email = getEmail();

        $monday = new DateTime();
        $monday->setTimestamp(strtotime('sunday this week'));
        $days = array_fill(0,7,[]);
        foreach($days as $key=>$value){
            $currDate = $monday -> add(new DateInterval("P1D"))->getTimeStamp();
            $days[$key]["date"] = $currDate;
            $days[$key]["day"] = date('l', $currDate);
            $days[$key]["menu"] = [
                [
                    "items" => [0,0,0,0],
                    "ordered" => 0
                ],
                [
                    "items" => [1,1,1,1],
                    "ordered" => 0
                ]
            ];
        }

        echo json_encode ($days);
        exit();
    });

    $app->post('/menu/:date', function ($date) {
    });

    $app->post('/order/:date', function () {

    });


    $app->run();

    function unAuthorized(){
        header('HTTP/1.0 403 Forbidden');

        echo 'Forbidden!';
        exit();
    }

    function getEmail()
    {
        if (!empty($_REQUEST['email']))
        {
            return $_REQUEST['email'];
        }
        else
        {
            unAuthorized();
        }
    }


    if ($_POST['submit']) {
        $name = $_POST['name'];
        $message = $_POST['message'];
        $from = 'From: Old City';
        $to = 'dcheglakov@gmail.com';
        $subject = 'Обеды в Офис';

        $body = "From: $name\n Message:\n $message";
        if (mail ($to, $subject, $body, $from)) {
            echo '<p>Сегодня ты не будешь голоден, мой друг!</p>';
        } else {
            echo '<p>Oops! An error occurred. Try sending your message again.</p>';
        }
    }

?>