<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
         	<div class="span12">
	      		
	      		<div class="widget">
						
					<div class="widget-header">
						<i class="icon-list-alt"></i>
						<h3>Bilgilerim</h3>
					</div> <!-- /widget-header -->
					
					<div class="widget-content">
						
						<form id="edit-profile" class="form-horizontal">
									<fieldset>
									
											<div class="control-group">											
											<label class="control-label" for="abone_no">Abone No</label>
											<div class="controls">
												<input type="text" class="span6 disabled" id="abone_no" value="<?php echo $musterino ?>" disabled>
												
											</div> <!-- /controls -->				
										</div> <!-- /control-group -->
										<div class="control-group">											
											<label class="control-label" for="tc">Tc No</label>
											<div class="controls">
												<input type="text" class="span6 disabled" id="tc" value="<?php echo $tcno ?>" disabled>
												
											</div> <!-- /controls -->				
										</div> <!-- /control-group -->
										
										<div class="control-group">											
											<label class="control-label" for="username">İsim</label>
											<div class="controls">
												<input type="text" class="span6 disabled" id="username" value="<?php echo $Adi ?>" disabled>
												
											</div> <!-- /controls -->				
										</div> <!-- /control-group -->
										
										<div class="control-group">											
											<label class="control-label" for="Soyisim">Soyisim</label>
											<div class="controls">
												<input type="text" class="span6 disabled" id="Soyisim" value="<?php echo $Soyadi ?>" disabled>
												
											</div> <!-- /controls -->				
										</div> <!-- /control-group -->
										<div class="control-group">											
											<label class="control-label" for="tel">Telefon</label>
											<div class="controls">
												<input type="text" class="span6 disabled" id="tel" value="<?php echo $phone1 ?>" disabled>
												
											</div> <!-- /controls -->				
										</div>	
										<div class="control-group">											
											<label class="control-label" for="mail">E-mail</label>
											<div class="controls">
												<input type="text" class="span6"  name="email" id="email" onblur="kontrol()" value="<?php echo $email ?>" /> <span class="w3-badge w3-green" id="feedback"></span>
                                           
												
											</div> <!-- /controls -->				
										</div>	 
										<div class="control-group">											
											<label class="control-label" for="Adres">Adres</label>
											<div class="controls">
												<input type="text" name="Adres" class="span6 disabled" id="Adres" value="<?php echo $address ?>" />
												
											</div> <!-- /controls -->				
										</div> <!-- /control-group -->
										
										
										
										<div class="control-group">											
											<label class="control-label" for="Adres">Bina No</label>
											<div class="controls">
												<input type="text" name="binano" class="span6 disabled" id="binano" value="" />
												
											</div> <!-- /controls -->				
										</div>
										<div class="control-group">											
											<label class="control-label" for="Adres">Bina Adı</label>
											<div class="controls">
												<input type="text" name="binaadi" class="span6 disabled" id="binaadi" value="" />
												
											</div> <!-- /controls -->				
										</div>
										<div class="control-group">											
											<label class="control-label" for="Adres">Sokak</label>
											<div class="controls">
												<input type="text" name="sokak" class="span6 disabled" id="sokak" value="" />
												
											</div> <!-- /controls -->				
										</div>
										<div class="control-group">											
											<label class="control-label" for="Adres">İç Kapı No</label>
											<div class="controls">
												<input type="text" name="ickapino" class="span6 disabled" id="ickapino" value="" />
												
											</div> <!-- /controls -->				
										</div>
										<div class="control-group">											
											<label class="control-label" for="Adres">Mahalle</label>
											<div class="controls">
												<input type="text" name="mahalle" class="span6 disabled" id="mahalle" value="" />
												
											</div> <!-- /controls -->				
										</div>
										<div class="control-group">											
											<label class="control-label" for="Adres">Blok Adı</label>
											<div class="controls">
												<input type="text" name="blokadi" class="span6 disabled" id="blokadi" value="" />
												
											</div> <!-- /controls -->				
										</div>
										
										
										
										 <div class="form-actions">
											<button type="button" class="btn btn-warning" id="gonder" disabled><i class="fa fa-refresh"></i> Güncelle</button> 
								
										</div>
									
									</fieldset>
						</form>
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
 
<script src="js/base.js"></script> 
<script>
$('#bg').addClass("active");
var Dogrula = false;
function kontrol(){

    //validate email
    var elem = $("#email")[0],
        emailInput = $("#email").val(),
        emailParts = emailInput.split('@'),
        text = '<i class="fa fa-minus"></i>';

    //at least one @, catches error
    if (emailParts[1] == null || emailParts[1] == "" || emailParts[1] == undefined) { 

        $('#feedback').html(text); 
		Dogrula = false;
    } else {

        //split domain, subdomain and tld if existent
        var emailDomainParts = emailParts[1].split('.');

        //at least one . (dot), catches error
        if (emailDomainParts[1] == null || emailDomainParts[1] == "" || emailDomainParts[1] == undefined) { 

            $('#feedback').html(text); 
			Dogrula = false;
         } else {

            //more than 2 . (dots) in emailParts[1]
            if (!emailDomainParts[3] == null || !emailDomainParts[3] == "" || !emailDomainParts[3] == undefined) { 

                $('#feedback').html(text); 
				Dogrula = false;
            } else {

                //email user
                if (/[^a-z0-9!#$%&'*+-/=?^_`{|}~]/i.test(emailParts[0])) {

                   $('#feedback').html(text); 
				   
					Dogrula = false;
                } else {

                    //double @
                    if (!emailParts[2] == null || !emailParts[2] == "" || !emailParts[2] == undefined) { 

                     		$('#feedback').html(text); 
Dogrula = false;
                    } else {

                         //domain
                         if (/[^a-z0-9-]/i.test(emailDomainParts[0])) {

                             $('#feedback').html(text); 
Dogrula = false;
                         } else {

                             //check for subdomain
                             if (emailDomainParts[2] == null || emailDomainParts[2] == "" || emailDomainParts[2] == undefined) { 

                                 //TLD
                                 if (/[^a-z]/i.test(emailDomainParts[1])) {

                                     $('#feedback').html(text); 
Dogrula = false;
                                  } else {

                                     $('#feedback').html('<i class="fa fa-check"></i>'); 
 Dogrula = true;
                                  }

                            } else {

                                 //subdomain
                                 if (/[^a-z0-9-]/i.test(emailDomainParts[1])) {

                                     $('#feedback').html(text); 
Dogrula = false;
                                 } else {

                                      //TLD
                                      if (/[^a-z]/i.test(emailDomainParts[2])) {

                                          $('#feedback').html(text); 
Dogrula = false;
                                      } else {

                                          $('#feedback').html('<i class="fa fa-check"></i>'); 
 Dogrula = true;
    }}}}}}}}}
};


	
	
	
	$('#gonder').click(function()
	{	
		
		if(Dogrula == true)
		{
			
			gonder();
		}else
		{
			$('#email').focus();
		}
		
		
	});
		
		function gonder()
		{
				$.ajax({
					type:"POST",
					data:$('#edit-profile').serialize(),
					url:"apiler/web_bilgileri_guncelle.php",
					beforeSend:function()
					{
					$('#gonder').html('<i class=" icon-asterisk icon-spin fa-3x fa-fw"></i> İletiliyor');
					},
					success:function(data)
					{
							if(data == 1)
							{	
												
							$('#gonder').html('Güncellendi');
							
							}else if(data==2)
							{
							alert("Daha Sonra Tekrar Deneyiniz");
							$('#gonder').html("<i class='fa fa-refresh'></i> Güncelle");
							return false;
							}
					}
				})		

		}
</script>