<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
         	<div class="span12">
	      			<div class="widget">
	      				<div class="alert">
	      					  <button type="button" class="close" data-dismiss="alert">×</button>
	      					   <strong></strong>Faturalarınız ile ilgili son 10 hareket gösterilmektedir.Daha Fazla Bilgi İçin En Yakın Şubemize Başvurmanız Gerekmektedir.  
	      						</div>
	      							
	      		<div class="widget-content">
	      		<div class="widget">
						
					<div class="widget-header">
						<i class="icon-list-alt"></i>
<?php
if ($_GET["tahsil"] == 0) {
$PaketTan = 'Ödenmiş Faturalar';										
} else {
$PaketTan = 'Ödenmemiş Faturalar';											
}
?>
						<h3><?php echo $PaketTan ?></h3>
					</div> <!-- /widget-header -->
					
					<div class="widget-content">
							
			<table class="table table-striped table-bordered">
				<thead>
					<tr>
						<th style="width:200px">Fatura TARİHİ</th>
						<th>Açıklama</th>
						<th style="width:100px">Tutar</th>
						<th style="width:200px">Son Ödeme TARİHİ</th>
					</tr>
				</thead>
                <tbody>

<?php 

$resultfatura = mysql_query("select * from userInvoices WHERE username='". $_SESSION["usernameonline"] ."' and tdurum='". $_GET["tahsil"] ."' and expire < NOW() limit 10");
	while($rowfatura = mysql_fetch_array($resultfatura)){         	$date1 = strtotime($rowfatura['expire']);
	$newdate2 = date('d-m-Y',strtotime("+10 day",$date1));
?>


				<tr>
					<td><?php echo $rowfatura["expire"] ?></td>
					<td class="bootstrap-width-none"><?php echo $rowfatura["taciklama"] ?></td>
					<td style="text-align:right" class="bootstrap-width-none"><?php echo $rowfatura["price"] ?> TL</td>
					<td style="text-align:center" class="bootstrap-width-none"><?php echo $newdate2 ?>
<?php
if ($_GET["tahsil"] == 1) {
?>
					<span  class='label label-danger'><a class='tarifeGecisi' style='color:#fff'  href='17'>Ödeme Yap <i class='icon-chevron-right'></i></a></span>	
<?php
}
?>
					</td>
				</tr>

<?php
  }

?>	
					               
                </tbody>
            </table>
			 			 
			  
			  
			  
					</div> <!-- /widget-content -->
						
				</div> <!-- /widget -->					
				
		    </div> <!-- /span12 -->     	
      </div>
      <!-- /row --> 
    </div>
    <!-- /container --> 
  </div>
  <!-- /main-inner --> 
</div>
<!-- /main -->

<!-- /extra -->
<div class="footer" style="">
  <div class="footer-inner">
    <div class="container">
      <div class="row">
        <div class="alert alert-success" style="font-size:18px">Faturalarınızı Düzenli Ödediğiniz İçin Teşekkür Ederiz.</div>
<div id="foot-align" class="span12" style=" line-height:50px;"> &copy; 2010 - 2016 Tüm Hakları Saklıdır.<f id='sozlesme-display'> <a href='musteri_sozlesmesi'>Müşteri Sözleşmesi</a> <a href='gizlilik_sozlesmesi'>Gizlilik Sözleşmesi</a> <a href='mesafeli_satis_sozlesmesi'>Mesafeli Satış Sözleşmesi </a> </f><p class='sozlesme'> <a href='musteri_sozlesmesi'>Müşteri Sözleşmesi</a> </p><p class='sozlesme'><a href='gizlilik_sozlesmesi'>Gizlilik Sözleşmesi</a></p><p class='sozlesme'> <a href='mesafeli_satis_sozlesmesi'>Mesafeli Satış Sözleşmesi </a> </p>   <img id="footer-image" src='img/safe.png'/> </div>

        <!-- /span12 --> 
      </div>
      <!-- /row --> 
    </div>
    <!-- /container --> 
  </div>
  <!-- /footer-inner --> 
</div>
<!-- /footer --> 
<!-- Le javascript
================================================== --> 
<!-- Placed at the end of the document so the pages load faster --> 
<script src="js/jquery-1.7.2.min.js"></script> 
<script src="js/bootstrap.js"></script>
  <script>
    window.setTimeout("hesapla();",100);
	var fiyat;
	function hesapla()
	{
		fiyat =0;
		tarife=30.00;
		
				
		tarife_ay = document.getElementById('s_ay').value;
		hesap     = tarife * tarife_ay;
		
				
		
		fiyat += parseInt(hesap);
		
		
		
		
		$('#appendedPrependedInput').val(fiyat.toFixed(2).replace('.',','));
	}

	</script>
<script src="js/base.js"></script> 
<script>
$('#pkt').addClass("active");


</script>

</body>
</html>