<?php
//    Register an autoloader
    $loader = new \Phalcon\Loader();

    class MenuItems extends \Phalcon\Mvc\Model{}
    class Orders extends \Phalcon\Mvc\Model{}

    //Create a DI
    try{
        $di = new \Phalcon\DI\FactoryDefault();

        //Setup the database service
        $di->set('db', function(){
            return new \Phalcon\Db\Adapter\Pdo\Mysql(array(
                "host" => "dcheglak.mysql.ukraine.com.ua",
                "username" => "dcheglak_menu",
                "password" => "w9tl46mx",
                "dbname" => "dcheglak_menu"
            ));
        });


        $app = new \Phalcon\Mvc\Micro($di);

        $app->get('/menu/{gId}', function ($gId) {
            $monday = new DateTime();
            $monday->setTimestamp(strtotime('monday this week'));
            $days = array_fill(0,5,[]);

            foreach($days as $key=>$value){
                $currDate = $monday -> getTimeStamp();
                $days[$key]["date"] = $currDate;
                $days[$key]["day"] = date('l', $currDate);
                $days[$key]["orders"] = new stdClass;
                $days[$key]["orderSaved"] = true;
                $days[$key]["menu"] = [
                    [
                        "priceId" => 0,
                        "items" => [Null,Null,Null,Null],
                        "order" => ["quantity" => 0]
                    ],
                    [
                        "priceId" => 1,
                        "items" => [Null,Null,Null,Null],
                        "order" => ["quantity" => 0]
                    ]
                ];
                $menuItems = MenuItems::find(array(
                    "conditions" => "date ='$currDate'"
                ));

                foreach($menuItems as $menuItem)
                {
                    $days[$key]["menu"][$menuItem -> priceId]["items"][$menuItem-> categoryId]= [
                        "id" => $menuItem -> id,
                        "itemId" => $menuItem -> itemId
                    ];
                };

                $myOrders = Orders::find(array(
                    "conditions" => "date ='$currDate' AND userId ='$gId'"
                ));

                foreach($myOrders as $order){
                    $days[$key]["menu"][$order -> priceId]["order"] = [
                        "id" => $order -> id,
                        "quantity" => (int)$order -> quantity,
                        "processedById" => $order -> processedById
                    ];

                };

                $orders = Orders::find(array(
                    "conditions" => "date ='$currDate' AND quantity > 0"
                ));

                $allOrders = [];

                foreach($orders as $order){
                    if(!array_key_exists($order -> userId, $allOrders)){
                        $allOrders[$order -> userId] = [
                            "orders" => [],
                            "processedById" => $order -> processedById
                        ];
                    }
                    $allOrders[$order -> userId]["orders"][$order -> priceId] = $order -> quantity;
                };

                if($allOrders){
                    $days[$key]["orders"] = $allOrders;
                }

                $monday -> add(new DateInterval("P1D"));
            }

            echo json_encode ($days);
            exit();
        });

        $app->post('/menu/{gId}', function ($gId) use ($app) {
            $post = (array) json_decode(file_get_contents("php://input"));

            $menuItem = new MenuItems();
            if(array_key_exists('id', $post)){
                $menuItem->update($post, array('id', 'date', 'categoryId', 'priceId', 'itemId'));
            }
            else
            {
                $menuItem->save($post, array('id', 'date', 'categoryId', 'priceId', 'itemId'));
            }

            print_r($menuItem->getMessages());

        });

        $app->post('/order/{date}', function ($date) {
            $post = (array) json_decode(file_get_contents("php://input"));

            foreach($post as $price){
                $order = new Orders();
                $data = (array) $price;
                if(array_key_exists('id', $price)){
                    $order->update($data, array('id', 'userId', 'date', 'priceId', 'quantity', 'processedById'));
                }
                else if($data['quantity'] > 0)
                {
                    $order->save($data, array('id', 'userId', 'date', 'priceId', 'quantity', 'processedById'));
                }
            }
            $result = new stdClass;
            $allOrders = [];

            $orders = Orders::find(array(
                "conditions" => "date ='$date' AND quantity > 0"
            ));
            foreach($orders as $order){
                if(!array_key_exists($order -> userId, $allOrders)){
                    $allOrders[$order -> userId] = [
                        "orders" => [],
                        "processedById" => $order -> processedById
                    ];
                }
                $allOrders[$order -> userId]["orders"][$order -> priceId] = $order -> quantity;
            };
            $result = $allOrders;
            echo json_encode($result);
        });

        $app->handle();
    }
    catch(Exception $e) {

        echo $e;
    }


    function unAuthorized(){
        header('HTTP/1.0 403 Forbidden');

        echo 'Forbidden!';
        exit();
    }

//    if ($_POST['submit']) {
//        $name = $_POST['name'];
//        $message = $_POST['message'];
//        $from = 'From: Old City';
//        $to = 'dcheglakov@gmail.com';
//        $subject = 'Обеды в Офис';
//
//        $body = "From: $name\n Message:\n $message";
//        if (mail ($to, $subject, $body, $from)) {
//            echo '<p>Сегодня ты не будешь голоден, мой друг!</p>';
//        } else {
//            echo '<p>Oops! An error occurred. Try sending your message again.</p>';
//        }
//    }

?>