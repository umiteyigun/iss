<?php
    error_reporting(0);
	require_once('SmsApi.php');
	header('Content-Type: text/plain;charset=utf-8');

    $apiuser=$_POST['kullaniciAdi'];
    $apipass=$_POST['kullaniciSifre'];
    $mesaj=$_POST['mesaj'];
    $tel=$_POST['telefonNo'];
    $smsapi = new SmsApi($apiuser, $apipass);
    //$no=$_GET['p'];
    $to_list = array($tel); 
    // array('00905300000002', '+905360000001');
	$message = $mesaj;
	
	$response = $smsapi->submit($to_list, $message);
	
	if($response->status){
		if($response->payload->Status->Code == 200){
			echo "Message is sent. Check your reports with SMS ID: " . $response->payload->MessageId;	
		}
		else{
			echo "No client error but server responded with error: "
				 . $response->payload->Status->Code  . "-" . $response->payload->Status->Description;
		}
	}
	else{
		echo "Client error: $response->error";	
	} 

?>