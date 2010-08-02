<?php

$handle = fopen ("php://stdin","r");
$line = fgets($handle);
$host = trim($line);

$m = new Mongo($host, array("replicaSet" => true));

// stupid freakin server list
$strSet = explode(",", $m->__toString());
$set = array();
foreach ($strSet as $server) {
    $s = trim($server, "[]");
    $set[$s] = true;
}

foreach ($set as $k=>$v) {
    echo "$k\n";
}


$db = $m->replset;
$x = 0;
while ($x < 5) {
    try {
        $z = $db->test->findOne();
        $x = $z['a'];
        echo "$x\n";
    } catch (MongoException $e) {
        echo "E\n";
    }
}

?>
