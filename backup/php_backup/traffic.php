<?php 
$user = $viewData['user']; 
?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const trafficInput = document.getElementById('txtTraffic');
    const priceDisplay = document.getElementById('divPrice');
    const pricePerGB = 5; // As per old system

    function updatePrice() {
        const trafficGB = parseInt(trafficInput.value) || 0;
        const totalPrice = (trafficGB * pricePerGB).toFixed(2);
        priceDisplay.textContent = totalPrice + ' TL';
    }

    trafficInput.addEventListener('keyup', updatePrice);
    trafficInput.addEventListener('change', updatePrice);

    // Initial calculation
    updatePrice();
});

function confirmSubmission() {
    return confirm('Are you sure you want to add this traffic quota?');
}
</script>

<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">Add Traffic Quota for <?php echo htmlspecialchars($user['username']); ?></h3>
            </div>
            <form method="POST" action="index.php?mod=doAddTraffic" onsubmit="return confirmSubmission();">
                <input type="hidden" name="username" value="<?php echo htmlspecialchars($user['username']); ?>">

                <div class="box-body">
                    <table class="table table-bordered">
                        <tr>
                            <th style="width: 200px;">Username</th>
                            <td><?php echo htmlspecialchars($user['username']); ?></td>
                        </tr>
                        <tr>
                            <th>Name Lastname</th>
                            <td><?php echo htmlspecialchars($user['name'] . ' ' . $user['lastname']); ?></td>
                        </tr>
                        <tr>
                            <th>Current Packet</th>
                            <td><span style="color: #000000; background-color: transparent; font-weight: bold;"><?php echo htmlspecialchars($user['packet']); ?></span></td>
                        </tr>
                        <tr>
                            <th>Traffic to Add (GB)</th>
                            <td>
                                <input id="txtTraffic" name="txtTraffic" type="number" value="1" min="1" class="form-control">
                            </td>
                        </tr>
                        <tr>
                            <th>Payment Mode</th>
                            <td>
                                <select name="peyMode" class="form-control">
                                    <option>Cash</option>
                                    <option>Card</option>
                                    <option>Draft</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Price</th>
                            <td>
                                <div id="divPrice" style="font-size: 24px; font-weight: bold; color: #00a65a;"></div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="box-footer">
                    <button type="submit" class="btn btn-success pull-right">Add Traffic</button>
                    <a href="index.php?mod=userlist" class="btn btn-default">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div> 