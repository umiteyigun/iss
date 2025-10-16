

<?php
error_reporting(E_ALL);
	ini_set("display_errors", 1);
	
session_start();

if(!empty($_GET['mod'])){
	if($_GET['mod'] == "logout"){
		session_destroy();
		header("Location: " . "login.php" );
	}
}

if(empty($_SESSION["usernameonline"]))header("Location: " . "login.php" );
 

$con = mysql_connect("localhost","root","321321");
mysql_select_db('radius', $con);

$result = mysql_query("select * from usersInfo where username = '" . $_SESSION["usernameonline"] ."'");
$row = mysql_fetch_array($result);
$count = mysql_num_rows($result);

if($count > 0){
	$musterino = $row['id'];
	$Adi = $row['name'];
	$Soyadi  = $row['lastname'];
	$paket = $row['packet'];
	$ftipi = $row['ftipi'];
	$email = $row['email'];
	$address = $row['address'];
	$phone1 = $row['phone1'];
	$phone2 = $row['phone2'];
	$phone3 = $row['phone3'];
	$osifre = $row['osifre'];
	$tcno = $row['tc'];
}

$resultftutar1 = mysql_query("select * from packetsInfo where name = '" . $paket ."'");
$rowftutar = mysql_fetch_array($resultftutar1);



$resultinfo = mysql_query("select count(*) from radcheck where username = '" . $_SESSION["usernameonline"] ."' and attribute = 'Auth-Type'");
$rowinfo = mysql_fetch_array($result);
  if($rowinfo['count'] > 0){
	$Durum = 'Pasif';
  } else {
	$Durum = 'Aktif';
  }

$resultfatura = mysql_query("select * from userInvoices where username = '" . $_SESSION["usernameonline"] ."' and tdurum = '1' and expire < NOW() ");
//$rowfatura = mysql_fetch_array($result);
$ii = '0';
$topla = '0';
  while($rowfatura = mysql_fetch_array($resultfatura)){
  $topla = $topla + $rowfatura['price'] ;
  $ii++;
  }


$resulttrafik = mysql_query("select * , (select count(*) from radacct where username = A.username)as pCount  from radacct as A where username = '" . $_SESSION["usernameonline"] . "' order by acctstarttime ");
$iii = '0';
$indirilen = '0';
$yuklenen = '0';
  while($rowtrafik = mysql_fetch_array($resulttrafik)){
  $indirilen  = $indirilen + $rowtrafik["acctinputoctets"] ;
  $yuklenen  = $yuklenen + $rowtrafik["acctoutputoctets"] ;
  $iii++;
  }
$indirilenm = number_format(((($yuklenen / 1024)/1024)/1024),2);
$yuklenenm = number_format(((($indirilen / 1024)/1024)/1024),2);

?>

<html lang="en">
<head>
<title>Kapsam Telekom Online İşlemler</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">

<link href="css/bootstrap.min.css" rel="stylesheet">
<link href="css/bootstrap-responsive.min.css" rel="stylesheet">
<link href="css/googlfont.css" rel="stylesheet">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
<link href="css/font-awesome.css" rel="stylesheet">
<link href="css/style.css" rel="stylesheet">
<link href="css/pages/dashboard.css" rel="stylesheet">
<link href="css/pages/plans.css" rel="stylesheet">
<link href="css/animate.css" rel="stylesheet">
<!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
<!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

<style>
.value
{
	font-size:18px!important;
}
#big_stats .stat
{
	height:auto!important;
}
#big_stats .stat:first-child
{
	width:40%;
}
#big_stats .stat
{
	width:12%;
}
@media all and (max-width: 950px) and (min-width: 1px)
{
	#big_stats .stat
{
	width:100%;

}
#big_stats .stat
{
	height:auto!important;
}
#big_stats .stat:first-child
{
		width:100%;
}
}
</style>
</head>
<body>
<div class="navbar navbar-fixed-top">
  <div class="navbar-inner">
    <div class="container">
	 <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span> </a>
      <div class="nav-collapse">
        <ul class="nav pull-right">
          <li class="dropdown">
		  <a class="dropdown-toggle" data-toggle="dropdown" style="font-size:14px;"  href="#" data-toggle="tooltip" data-placement="bottom" title="Bildirimlerim">
		  <i class=" icon-bell"></i><span style="font-size:14px;"></span><b class="caret"></b></a>
           	<ul class="dropdown-menu">
				<li><a href="">Bildiriminiz Bulunmamaktadır.</a></li>           
            </ul>
          </li>
		  <li class="dropdown">
		  <a href="#" class="dropdown-toggle" data-toggle="dropdown" style="font-size:14px;">
		  <i class="icon-user"></i> <?php echo $Adi ?> <?php echo $Soyadi ?> Abone No: <?php echo $musterino ?> <b class="caret"></b></a>
            <ul class="dropdown-menu">
              <li><a href="index.php?mod=logout">Çıkış Yap</a></li>
            </ul>
          </li>
        </ul>
       
      </div>
      <!--/.nav-collapse -->     
     </div>
    <!-- /container --> 
  </div>
  <!-- /navbar-inner --> 
</div>
<!-- /navbar -->
<div class="subnavbar">
  <div class="subnavbar-inner">
    <div class="container" style="text-align:center">
      <ul class="mainnav">
        <li id="bld" class="faa-horizontal animated-hover"><a href="index.php"><i class="icon-dashboard"></i><span>Ana Sayfa</span> </a> </li>
        <li id="bg"><a href="?mod=bilgiler"><i class="icon-list-alt"></i><span>Bilgilerim</span> </a> </li>
        <li id="trf"><a href="?mod=tarifeler"><i class="icon-th-large"></i><span>Tarifelerimiz</span> </a></li>
        <li id="trfi"><a href="?mod=islemler"><i class="icon-bar-chart"></i><span>Trafik İşlemlerim</span> </a> </li>
				        <li class="dropdown" id="pkt"><a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-retweet"></i><span>Paket İşlemlerim</span> <b class="caret"></b></a>
          <ul class="dropdown-menu">
            <li><a href="?mod=fatura&tahsil=1">Ödenmemiş</a></li>
            <li><a href="?mod=fatura&tahsil=0">Ödenmiş</a></li>           
          </ul>
        </li>
						<li id="knt"><a href="?mod=sms"><i class="icon-credit-card"></i><span>SMS İşlemleri</span> </a> </li>
        <li id="havalee"><a href="havale-bildirimi"><i class="icon-share"></i><span>Havale Bildirimi</span> </a> </li>
        <li id="arizaKaydi" style="border-right:solid 1px #d9d9d9;"><a  href="ariza-kaydi"><i class="icon-wrench"></i><span>Arıza Kaydı</span> </a> </li>
      </ul>
    </div>
    <!-- /container --> 
  </div>
  <!-- /subnavbar-inner --> 
</div>
<!-- /subnavbar -->

						<?php 
							if(!empty($_GET['mod'])){
							 include $_GET['mod'].'.php';
							 } 
							else { 
							 include 'main.php'; 
							 } 
						?>

</body>
</html>