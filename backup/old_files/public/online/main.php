



<div class="main" style="border:none;">
  <div class="main-inner">
    <div class="container">
      <div class="row">
	  <div class="span12">
<?php 
$result = mysql_query("select * from radcheck WHERE username='" . $_SESSION["usernameonline"] ."' and attribute='Auth-type' and value='Reject'");
$row = mysql_fetch_array($result);
$count = mysql_num_rows($result);

if ($count > 0) {
						
?>
	  	<div class="widget">
	  		<div class="alert">
	  			<button type="button" class="close" data-dismiss="alert">×</button>
	  			<strong>İnternet erişiminiz geçici olarak durdurulmuştur. Detaylı bilgi için müşteri hizmetleriyle iletişime geçiniz.</strong>  
	  		</div>
	  	</div>
<?php

}

?>
          <div class="widget widget-nopad">
            <div class="widget-header"> <i class="icon-list-alt"></i>
              <h3> Genel Bakış</h3>
            </div>
            <!-- /widget-header -->
            <div class="widget-content">
              <div class="widget big-stats-container">
                <div class="widget-content">
                  
                  <div id="big_stats" class="cf">
				   <div data-toggle="tooltip" data-placement="top" title="Üyelik Durumunuz" class="stat col-xs-12"> </br> <span class="value">Üyelik Durumum <?php echo $Durum ?></span> </div>
                    <div data-toggle="tooltip" data-placement="top" title="Ödenmemiş Fatura Adedi ve Toplam Tutar"  class="stat"></br><span class="value"><?php echo $ii ?> Adet <?php echo $topla ?> TL</span></div>
					<div data-toggle="tooltip" data-placement="top" title="Fatura Ödeme" class="stat">		<img src='img/conta-interna.png' width="80px"></p> <span class="value">
					<a href="paket-uzat" style="color:red;"> Ödeme Yap </a>					</span> </div>
      
                    <!-- .stat --> 
                  </div>
                </div>
                <!-- /widget-content --> 
              
              </div>
            </div>
          </div>   


		  <div class="widget widget-nopad">
            <div class="widget-header"> <i class="icon-list-alt"></i>
              <h3> Tarifeme Genel Bakış</h3>
            </div>
            <!-- /widget-header -->
            <div class="widget-content">
              <div class="widget big-stats-container">
                <div class="widget-content">
                  
                 <div id="big_stats" class="cf">
		 <div class="stat"> <span class="value"><?php echo $paket ?> <?php echo $ftipi ?></span><p class="value"></p><p class="value"><?php echo $rowftutar['price'] ?>,00 <i style="font-size:18px" class="fa fa-try"></i></p> </div>
		 <div class="stat"><i class="icon-circle-arrow-down"></i> <span class="value">Download <?php echo $indirilenm ?> GB</span></div>
		 <div class="stat"><i class="icon-circle-arrow-up"></i> <span class="value">Upload <?php echo $yuklenenm ?> GB</span> </div>
		 <div class="stat"><i class="icon-plus-sign"></i> <span class="value">Toplam <?php echo $indirilenm+$yuklenenm ?> GB</span> </div>
                    
      
                    <!-- .stat --> 
                  </div>
                </div>
                <!-- /widget-content --> 
              
              </div>
            </div>
          </div>
          <!-- /widget -->
         
       
        </div>
		
	

        <!-- /span6 --> 
      </div>
      <!-- /row --> 
    </div>
    <!-- /container --> 
  </div>
  <!-- /main-inner --> 
</div>
<!-- /main -->

<script type="text/javascript">
  window.onload = function () {
    var chart = new CanvasJS.Chart("chartContainer",
    {

      title:{
        text: "<?php echo $_SESSION["usernameonline"] ?> Traffik Geçmişi"
      },
      axisX:{  

        valueFormatString: "DD-MMM",
		labelAngle: -20
      },

      axisY: {
			labelFormatter: function (e) {
				return CanvasJS.formatNumber(e.value, "0.0#") + "G";
			},
			includeZero: true
		},
      
      data: [
      {        
        type: "spline",
        lineThickness: 2,
        dataPoints: [
		<?php
		#$result = mysql_query("select * from radacct where username = '" . $_GET['username'] . "' group by acctstoptime");
		$result = mysql_query("select sum(acctinputoctets)as acctinputoctets , acctstoptime  from radacct where username = '" . $_SESSION["usernameonline"] . "' group by DATE_FORMAT(acctstoptime, '%Y%m%d') ");
		while($row = mysql_fetch_array($result)){
			if($row['acctstoptime'] != null)echo "{x: new Date(Date.UTC (" . date("Y,m,d, H,i" ,strtotime($row['acctstoptime'])) . ") ), y: " . number_format((($row['acctinputoctets']/1024)/1024)/1024,2) . "},\n";
		}
		?>
        
        ]
      }    
      ]
    });

chart.render();
}
</script>
<script type="text/javascript" src="http://canvasjs.com//assets/script/canvasjs.min.js"></script>
<div id="chartContainer" style="height: 300px; width: 100%; margin-bottom:40px"></div>

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
<script language="javascript" type="text/javascript" src="js/full-calendar/fullcalendar.min.js"></script> 
<script src="js/base.js"></script> 

<script>     

        var lineChartData = {
            labels: ["January", "February", "March", "April", "May", "June", "July"],
            datasets: [
				{
				    fillColor: "rgba(220,220,220,0.5)",
				    strokeColor: "rgba(220,220,220,1)",
				    pointColor: "rgba(220,220,220,1)",
				    pointStrokeColor: "#fff",
				    data: [65, 59, 90, 81, 56, 55, 40]
				},
				{
				    fillColor: "rgba(151,187,205,0.5)",
				    strokeColor: "rgba(151,187,205,1)",
				    pointColor: "rgba(151,187,205,1)",
				    pointStrokeColor: "#fff",
				    data: [28, 48, 40, 19, 96, 27, 100]
				}
			]

        }

       


        $(document).ready(function() {
        var date = new Date();
        var d = date.getDate();
        var m = date.getMonth();
        var y = date.getFullYear();
        var calendar = $('#calendar').fullCalendar({
          header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
          },
          selectable: true,
          selectHelper: true,
          select: function(start, end, allDay) {
            var title = prompt('Event Title:');
            if (title) {
              calendar.fullCalendar('renderEvent',
                {
                  title: title,
                  start: start,
                  end: end,
                  allDay: allDay
                },
                true // make the event "stick"
              );
            }
            calendar.fullCalendar('unselect');
          },
          editable: true,
          events: [
            {
              title: 'All Day Event',
              start: new Date(y, m, 1)
            },
            {
              title: 'Long Event',
              start: new Date(y, m, d+5),
              end: new Date(y, m, d+7)
            },
            {
              id: 999,
              title: 'Repeating Event',
              start: new Date(y, m, d-3, 16, 0),
              allDay: false
            },
            {
              id: 999,
              title: 'Repeating Event',
              start: new Date(y, m, d+4, 16, 0),
              allDay: false
            },
            {
              title: 'Meeting',
              start: new Date(y, m, d, 10, 30),
              allDay: false
            },
            {
              title: 'Lunch',
              start: new Date(y, m, d, 12, 0),
              end: new Date(y, m, d, 14, 0),
              allDay: false
            },
            {
              title: 'Birthday Party',
              start: new Date(y, m, d+1, 19, 0),
              end: new Date(y, m, d+1, 22, 30),
              allDay: false
            },
            {
              title: 'EGrappler.com',
              start: new Date(y, m, 28),
              end: new Date(y, m, 29),
              url: 'http://EGrappler.com/'
            }
          ]
        });
      });
	  
	 
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();
});

    </script><!-- /Calendar -->
	<script>
$('#bld').addClass("active");
</script>



