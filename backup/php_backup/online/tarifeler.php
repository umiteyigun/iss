<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
	  <div class="span12">
          <div class="widget widget-nopad">
            <div class="widget-header"> <i class="icon-list-alt"></i>
              <h3>Mevcut Tarifeniz</h3>
            </div>
            <!-- /widget-header -->
            <div class="widget-content">
              <div class="widget big-stats-container">
                <div class="widget-content">
                 
                  <div id="big_stats" class="cf">
       <div class="stat"> 
	   <span class="value"><?php echo $paket ?> <?php echo $ftipi ?></span> </div>
       <div class="stat"> 
	   <span class="value">Akn Yok	   </span> </div>
	   <div class="stat"> 
	   <span class="value">Taahhüt Yok	   </span> </div>
	   <div class="stat"> 
	   <span class="value">Limit Yok	   </span> </div>
       <div class="stat"> <span class="value"><?php echo $rowftutar['price'] ?>,00 TRY</span> </div>
                  
	              
                  </div>
                </div>
                <!-- /widget-content --> 
                
              </div>
            </div>
          </div>
       
      
        </div>
		
		
         	<div class="span12">
	      		
	      		<div class="widget">
						
					<div class="widget-header">
						<i class="icon-th-large"></i>
						<h3>Tarifelerimiz</h3>
					</div> <!-- /widget-header -->
					
					
	<div style="background: transparent !important; border: none !important; padding: 0 !important;">
  
              <style>
                /* widget-content sınıfının beyaz arka planını geçersiz kıl */
                div[style*="background: transparent"] {
                  background: transparent !important;
                  border: none !important;
                  padding: 0 !important;
                }
                /* Tüm widget-content sınıflarını geçersiz kıl */
                .widget-content, div.widget-content {
                  background: transparent !important;
                  border: none !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                }
              </style>
              <table class="table table-striped table-bordered packet-table">
                <thead>
                  <tr>
                 	<th style="width:200">Paket Adı</th>
					
					<th style="text-align:center" class="bootstrap-width-none">AKN</th>
					<th style="text-align:center" class="bootstrap-width-none">Taahhüt</th>
					<th style="text-align:center" class="bootstrap-width-none">LİMİT</th>
					<th style="text-align:center" class="bootstrap-width-none">AKTİVASYON BEDELİ</th>
					<th  class="ortala" style="text-align:right">FİYAT</th>
					<th style="text-align:center">SEÇ</th>
                  </tr>
                </thead>
                <tbody>
						
<?php 

$resultpaketler = mysql_query("select * from packetsInfo  where sat = '1' ");
  while($rowpaketler = mysql_fetch_array($resultpaketler)){

?>

<tr>
<td style="text-align:left; color: #000000 !important; font-weight: bold !important; background-color: #FFFFFF !important;"><?php echo $rowpaketler["name"] ?>  <?php echo $ftipi ?></td>
<td style="text-align:center" class="bootstrap-width-none">
<i class='icon-remove'></i></td>
<td style="text-align:center" class="bootstrap-width-none">
<i class='icon-remove'></i></td>
<td style="text-align:center" class="bootstrap-width-none">
<i class='icon-remove'></i></td>
<td style="text-align:center" class="bootstrap-width-none">TRY</td>
<td class="ortala"  style="text-align:right"><?php echo $rowpaketler["price"] ?>,00 TRY</td>
<td style="text-align:center; padding: 0;">
<span  class='label label-danger'><a class='tarifeGecisi' onclick='return false;' style='color:#fff'  href='17'>Geçiş Talep Et <i class='icon-chevron-right'></i></a></span>					</td>
</tr>



<?php
  }

?>					

				
     </tbody>
              </table>
            </div>
	 <div class="modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
          Tarife Geçiş Onayı            </div>
            <div class="modal-body">
             Tarife Geçişleri geçici olarak kısa bir süre müşteri hiametlerinden yapılabilmektedir.<br>
			 Mevcut Tarifenizin Geçiş İşlemini Onaylıyormusunuz?             Tarifeye Bağlı Ek Geçiş Ücreti Çıkabilir.			
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Vazgeç</button>
                <a class="btn btn-danger btn-ok" disabled>Onayla</a>
            </div>
        </div>
    </div>
</div>	
						
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
$('#trf').addClass("active");
$('.icon-remove').css("color","#ff7f74");

// Paket adı kolonundaki yazıları siyah yap
$(document).ready(function() {
    $('.packet-table td:first-child').css({
        'color': '#000000',
        'font-weight': 'bold'
    });
});

var WindowWidth = $(window).width();
if(WindowWidth>979)
{
$(document).on("click",".tarifeGecisi",function(){
	var t_id = $(this).attr('href');

	$('#confirm-delete').modal('show'); 
	$("#confirm-delete a").on("click",function()
		{
			
	$('#confirm-delete').modal('hide'); 			
	$.ajax({
		url:'users/tarifeler/gecis_talebi.php',
		type:'GET',
		data:'t_id='+t_id+'&u_id=10116',		
		success:function(data)
			{
			if(data == 1)
			{
				alert("Başarılı Olarak Talep Oluşuturldu.");
			}else if(data ==4)
			{
				alert("Bekleyen Geçiş Talebiniz Bulunmaktadır.");
			}else
			{
				alert("Hata Oluştu Daha SOnra Tekrar Deneyiniz.");
			}
			}
		})
		});
});	
}else
{
	
$(document).on("click",".tarifeGecisi",function(){
	var r = confirm("Geçiş İşlemini Onaylıyormusunuz?");
	if (r == true) {
	
   
	} else {
   return false;
	}
});	
}

</script>