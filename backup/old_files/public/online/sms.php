<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
         	<div class="span12">
	      			<div class="widget">
	      				<div class="alert">
	      					  <button type="button" class="close" data-dismiss="alert">×</button>
	      					   <strong></strong>SMS ile ilgili son 10 hareket gösterilmektedir.Daha Fazla Bilgi İçin En Yakın Şubemize Başvurmanız Gerekmektedir.  
	      						</div>
	      							
	      		<div class="widget-content">
	      		<div class="widget">
						
					<div class="widget-header">
						<i class="icon-list-alt"></i>
						<h3>SMS İŞLEMLERİ</h3>
					</div> <!-- /widget-header -->
					
					<div class="widget-content">
							
			<table class="table table-striped table-bordered">
				<thead>
					<tr>
						<th style="width:20px">SIRA</th>
						<th>SMS</th>
						<th style="width:100px">TARİH</th>
						<th style="width:200px">GÖNDERİLEN NO</th>
					</tr>
				</thead>
                <tbody>

<?php
$sayi = 0;
$getsms = mysql_query("select * from sms where username = '".$_SESSION["usernameonline"]."' order by id DESC limit 10");
   while($smsrow = mysql_fetch_array($getsms)){
     $smsid = $smsrow['id'];
     $user = $smsrow['username'];
     $sms = $smsrow['sms'];
     $number = $smsrow['number'];
     $smstarih = $smsrow['date'];
     $sayi++;
     $source = $smstarih;
     $date = new DateTime($source);



?>



				<tr>
					<td><?php echo $sayi ?></td>
					<td class="bootstrap-width-none"><?php echo $sms ?></td>
					<td style="text-align:right" class="bootstrap-width-none"><?php echo $date->format('d.m.Y H:i:s') ?></td>
					<td style="text-align:center" class="bootstrap-width-none"><?php echo $number ?></td>
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
<div class="footer">
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
 
<script src="js/base.js"></script> 
<script>
$('#knt').addClass("active");
</script>
<script>
var d = $(window).height();
//alert(d);
d = d-505;
$(".footer").css("margin-top",d);
</script>