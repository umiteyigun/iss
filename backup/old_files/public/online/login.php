<br><br><br><br><br><br><br>
<style>
.panel{
		-webkit-border-radius: 7px;
		-moz-border-radius: 7px;
		border-radius: 7px;
		border:1px solid #DDDDDD;
		position:relative;
		width:600px;
		margin:5px;
	}
	TD{padding:5px}
	input,select{background-color:#F9F9F9; width:400px; border:1px solid #d0d0d0; height:30px; padding:3px; color:#7B8394; font-size:15px; border-radius: 3px;}
	.Button{background-color:#00C6D7; color:#FFF; padding:5px; text-align:center; width:150px;  margin:5px; cursor:pointer; border:0px solid  transparent}
	h1{
		border-radius: 7px 7px 0px 0px;
		
		border:1px solid #DDDDDD;
	}
	
</style>
<?php
if($_POST){
	$username = $_POST['onlineuser'];
	$pass = $_POST['onlinesifre'];
	
	if($username == "" || $pass == "")return;
	
	$con = mysql_connect("localhost","root","321321");
	mysql_select_db('radius', $con);
	
	$result = mysql_query("select * from usersInfo where username = '" . $username . "' and osifre = '" . $pass . "'");
	$row = mysql_fetch_array($result);
	$count = mysql_num_rows($result);
	
	if($count > 0){
		session_start();
		$_SESSION["usernameonline"] = $row['username'];
		$_SESSION["photoonline"]    = $row['photo'];
		$_SESSION["mode"]     = $row['mode'];
//		if($_SESSION["photoonline"] == "")$_SESSION["photoonline"] = "admin.jpg";
//		$arr = explode(",",$row['mode']);
//		foreach($arr AS $val){
			
//			if($val == 'Router')$_SESSION['Router'] = "true";
//			if($val == 'Ippool')$_SESSION['Ippool'] = "true";
//			if($val == 'Members')$_SESSION['Members'] = "true";
//			if($val == 'Packets')$_SESSION['Packets'] = "true";
//			if($val == 'Customers')$_SESSION['Customers'] = "true";
//			if($val == 'Invoices')$_SESSION['Invoices'] = "true";
//			if($val == 'LogManager')$_SESSION['LogManager'] = "true";
//			if($val == 'MikrotikManager')$_SESSION['MikrotikManager'] = "true";
//			if($val == 'Dashboard')$_SESSION["Dashboard"] = "true";
			
//		}
		
		header("Location: " . "index.php" );
	}else{
		$message = "<span style='color:#CC0000'>Hatalı Şifre</span>";
	}

}
?>
<table align="center">
<tr>
<td>
<div class="panel">
<h1 style="background-color:#00C6D7; padding:15px; margin-top:0px; color:#fff">Kapsam Telekom Online İşlemler</h1>
<form method="POST" action="login.php">
<table align="center" width="600px" style="margin:15px">
	<tr>
		<td>Kullanıcı Adı</td> 
		<td><input type="text" name="onlineuser"></td>
	</tr>
	<tr>
		<td>Şifre</td>
		<td><input type="password" name="onlinesifre"></td>
	</tr>
	<tr>
		<td></td>
		<td style="padding-left:120px"><input type="submit" value="Giriş Yap" style="width:170px;"></td>
	</tr>
	<tr>
		<td></td>
		<td><?php echo $message ?></td>
	</tr>
</table>
</div>
</td>
</tr>
</table>
</form>

