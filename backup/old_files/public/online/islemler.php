<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
         	<div class="span12">
	      		<div class="widget">
						<div class="alert">
							  <button type="button" class="close" data-dismiss="alert">×</button>
							   <strong></strong>Bağlantınızla ilgili son 10 hareket gösterilmektedir.Daha Fazla Bilgi İçin En Yakın Şubemize Başvurmanız Gerekmektedir.  
								</div>
					<div class="widget-header">
						<i class="icon-bar-chart"></i>
						<h3>Trafik Detayım</h3>
					</div> <!-- /widget-header -->
									
				<div class="widget-content">
              <table class="table table-striped table-bordered">

<div class="graph" style="width:100%; margin-top:-3px">
	<div class="tables">
		<table class="table"> <thead> <tr> <th>#</th> <th>Bağlanma Zamanı</th> <th>Kopma Zamanı</th> <th>Toplam</th> <th>Local IP</th>  <th>Dış IP</th> <th>Download</th> <th>Upload</th> <th>MAC</th>  </tr></thead> <tbody>

		<?php
			$p = 0;
			$page = 0;
			$size = 10;
			$pCount = 0;
			if(!empty($_GET['p']))$p = $_GET['p'];
			$page = $p * $size;
			$result = mysql_query("select * , (select count(*) from radacct where username = A.username)as pCount  from radacct as A  INNER JOIN metroIP ON username = metroIP.user where username = '" . $_SESSION["usernameonline"] . "' order by acctstarttime desc limit " . $page . "," . $size);
			$count = 1;
			$class = 'class="active"';
			while($row = mysql_fetch_array($result)){
				$pCount = $row["pCount"];
				echo '<tr ' . $class . '>';
				echo '<th scope="row" width="25px">'.($count + ($size * $p)).'</th>';
				echo '<td>'.date('Y-m-d H:i' , strtotime($row["acctstarttime"])).'</td>';
				
				if($row["acctstoptime"] == ''){
					echo '<td><div class="panel" style="border:0px solid transparent; background-color:#90B456; text-align:center; color:#FFF; width:70px; padding:5px; margin:0px">Online</div></td>';
				}else{
					echo '<td>'.date('Y-m-d H:i' , strtotime($row["acctstoptime"])).'</td>';
				}
	
				//echo '<td>'.number_format(($row["acctsessiontime"] / 60),2) .' <span style="color:#cc0000; font-size:12px">min</span></td>';
			
				echo '<td>'.time_elapsed($row["acctsessiontime"] ) .'</td>';
				
				echo '<td>'.$row["framedipaddress"].'</td>';
				echo '<td>'.$row["ipaddress"].'</td>';
				echo '<td>'.number_format((($row["acctoutputoctets"] / 1024)/1024),2) .' <span style="color:#cc0000; font-size:12px">Mb</span></td>';
				echo '<td>'.number_format((($row["acctinputoctets"] / 1024)/1024),2) .' <span style="color:#cc0000; font-size:12px">Mb</span></td>';
				echo '<td>'.$row["callingstationid"].'</td>';
				
				echo '</tr>';
				$count++;
				
				if($class == ''){
					$class = 'class="active"';
				}else{
					$class = '';
				}
			}

			
			
function time_elapsed($secs){
	$bit = array(
    'y' => $secs / 31556926 % 12,
    'w' => $secs / 604800 % 52,
    'd' => $secs / 86400 % 7,
    'h' => $secs / 3600 % 24,
    'm' => $secs / 60 % 60,
    's' => $secs % 60
);

/* 
foreach($bit as $k => $v)
if($v > 0)$ret[] = $v . $k;        
return join(' ', $ret);
*/
}


//function pager($p, $size, $pCount){
//	 $_SERVER["QUERY_STRING"];
		//Pagination
//		$page_limit = $p + 4;
//		$i = $p - 3;
//		$last = ceil($pCount/$size)-1;
//		if($pCount <= $size)return;
//		if($i <0 )$i=0;
//		if($i > 0)echo "<div class='grdPager'><a href='?mod=userHistory&username=".$_SESSION["usernameonline"]."&p=0'>first</a></div>";
//		for($i;$i<$page_limit;$i++){
//			if($last < $i)break;
//			if($i == $p){
//				echo "<div class='grdPagerSelected'><a href='?mod=userHistory&username=".$_SESSION["usernameonline"]."&p=$i'>".($i+1)."</a></div>";
//			}else{
//				echo "<div class='grdPager'><a href='?mod=userHistory&username=".$_SESSION["usernameonline"]."&p=$i'>".($i+1)."</a></div>";
//			}
//		}
//		if($last <= $pCount && ($i ) <= $last)echo "<div class='grdPager'><a href='?mod=userHistory&username=".$_SESSION["usernameonline"]."&p=$last'>last</a></div>";		
//}
?>
		
		</tbody> </table> 
		<div></div>
	</div>
</div>
       
					       </tbody>
				       </table>
				    </div>
			    </div>				
		    </div>   	
        </div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-inner">
    <div class="container">
      <div class="row">
        <div class="alert alert-success" style="font-size:18px">Faturalarınızı Düzenli Ödediğiniz İçin Teşekkür Ederiz.</div>
<div id="foot-align" class="span12" style=" line-height:50px;"> &copy; 2010 - 2016 Tüm Hakları Saklıdır.<f id='sozlesme-display'> <a href='musteri_sozlesmesi'>Müşteri Sözleşmesi</a> <a href='gizlilik_sozlesmesi'>Gizlilik Sözleşmesi</a> <a href='mesafeli_satis_sozlesmesi'>Mesafeli Satış Sözleşmesi </a> </f><p class='sozlesme'> <a href='musteri_sozlesmesi'>Müşteri Sözleşmesi</a> </p><p class='sozlesme'><a href='gizlilik_sozlesmesi'>Gizlilik Sözleşmesi</a></p><p class='sozlesme'> <a href='mesafeli_satis_sozlesmesi'>Mesafeli Satış Sözleşmesi </a> </p>   <img id="footer-image" src='img/safe.png'/> </div>

      </div>
    </div>
  </div>
</div>
<script src="js/jquery-1.7.2.min.js"></script> 
<script src="js/bootstrap.js"></script>
<script src="js/base.js"></script> 
<script>
$('#trfi').addClass("active");
</script>