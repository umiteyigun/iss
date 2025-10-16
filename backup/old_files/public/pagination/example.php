<html>
<head>
	<style>
		a{
			font-family:tahoma; color:#888888; font-size:15px; text-decoration:none; padding:3px; margin:1px; border:1px solid #a0a0a0;'
		}
		a:hover{color:#ff8400; border:1px solid #ff8400; background-color:#f0f0f0}
		a:active{color:#ff8400; border:1px solid #ff8400; background-color:#f0f0f0}
		TD{
			font-family:tahoma; font-size:12px;padding:5px;
		}
		table{
			border:1px solid #888
		}
		tr{
			background-color:#f0f0f0
		}
	</style>
</head>
<body>

<?php

error_reporting(E_ALL);
ini_set("display_errors", 1);

include('poyrazPagination.php');

$grid = new poyrazPagination();

$grid->set_page($_GET['p']);
$grid->set_length(7);
$grid->set_query("select * from radacct");
$count = $grid->getRows();

echo $count;

echo "<br>";

echo $grid->pager();


?>

</body>
</html>