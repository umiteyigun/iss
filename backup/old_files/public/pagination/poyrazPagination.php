<?php

$con = mysql_connect("localhost","radius","321321");
mysql_select_db('radius', $con);

class poyrazPagination
{
    public $query;
	public $page;
	public $length;
	public $name;
	public $rowsCount;
	
	public function setname($name){
		$this->length = $name;
	}
	
	
	public function set_length($strlength){
		$this->length = $strlength;
	}
		
	public function set_page($strpage){
		$this->page = $strpage;
	}
	
	public function set_query($strquery){
		$this->query = $strquery;
	}
	
    public function getRowCount(){
		$query = $this->query;
		$result = mysql_query($query);
		$count = mysql_num_rows($result);
		$this->rowsCount = $count;
	}
	
	public function getRows(){
		$page = $this->page;
		$page--;
		$length = $this->length;
		$query = $this->query;
				
		$tbl = "<table>";
		
		$from = $page * $length;
		
		$result = mysql_query($query . " limit " . $from . "," . $length);
		while($row = mysql_fetch_array($result)){
			$tbl .= "<tr>";
			$tbl .= "<td>".$row['radacctid']."</td>\n";
			$tbl .= "<td>".$row['username']."</td>\n";
			$tbl .= "<td>".$row['acctstarttime']."</td>\n";
			$tbl .= "<td>".$row['acctstoptime']."</td>\n";
			$tbl .= "<td>".$row['acctinputoctets']."</td>\n";
			$tbl .= "<td>".$row['acctoutputoctets']."</td>\n";
			$tbl .= "</tr>";
		}
		
		$tbl .= "</table>";
		return $tbl;
	}
	
	public function pager(){
		$query = $this->query;
		$length = $this->length;
		$result = mysql_query($query);
		$count = mysql_num_rows($result);
		
		for($i=1;$i<=5;$i++){
			echo "<a href='?p=$i' >$i</a>";
		}
		$last = ceil ($count / $length);
		echo "<a href='?p=$last'>last</a>";
	}
	
	
}
