<?php 
$user = $viewData['user']; 
$packets = $viewData['packets'];
?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const packetSelect = document.getElementById('drpPacket');
    const monthSelect = document.getElementById('drpMonth');
    const priceDisplay = document.getElementById('divPrice');
    const packetNameInput = document.getElementById('pckName');

    function updatePrice() {
        const selectedPacket = packetSelect.options[packetSelect.selectedIndex];
        const packetPrice = parseFloat(selectedPacket.value);
        const packetName = selectedPacket.text.split(' (')[0];
        const months = parseInt(monthSelect.value);
        const totalPrice = (packetPrice * months).toFixed(2);
        
        priceDisplay.textContent = totalPrice + ' TL';
        packetNameInput.value = packetName; // Update hidden input with the clean packet name
    }

    packetSelect.addEventListener('change', updatePrice);
    monthSelect.addEventListener('change', updatePrice);

    // Initial calculation
    updatePrice();
});

function confirmSubmission() {
    return confirm('Are you sure you want to renew this subscription?');
}
</script>

<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Renew Subscription for <?php echo htmlspecialchars($user['username']); ?></h3>
            </div>
            <form method="POST" action="index.php?mod=doUserRenew" onsubmit="return confirmSubmission();">
                <input type="hidden" name="username" value="<?php echo htmlspecialchars($user['username']); ?>">
                <input type="hidden" id="pckName" name="pckName" value="">

                <div class="box-body">
                    <table class="table table-bordered">
                        <tr>
                            <th style="width: 200px;">Current Expiration</th>
                            <td><span class="label label-danger"><?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($user['expire']))); ?></span></td>
                        </tr>
                        <tr>
                            <th>Name Lastname</th>
                            <td><?php echo htmlspecialchars($user['name'] . ' ' . $user['lastname']); ?></td>
                        </tr>
                         <tr>
                            <th>Packet</th>
                            <td>
                                <select id="drpPacket" name="drpPacket" class="form-control">
                                    <?php foreach ($packets as $packet): ?>
                                        <option value="<?php echo htmlspecialchars($packet['price']); ?>" <?php echo ($user['packet'] == $packet['name']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($packet['name']); ?> (<?php echo htmlspecialchars($packet['price']); ?> TL)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Months to Add</th>
                            <td>
                                <select id="drpMonth" name="drpMonth" class="form-control">
                                    <?php for ($i=1; $i<=12; $i++): ?>
                                        <option value="<?php echo $i; ?>"><?php echo $i; ?> Month(s)</option>
                                    <?php endfor; ?>
                                </select>
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
                            <th>Total Price</th>
                            <td>
                                <div id="divPrice" style="font-size: 24px; font-weight: bold; color: #3c763d;"></div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="box-footer">
                    <button type="submit" class="btn btn-warning pull-right">Renew Subscription</button>
                    <a href="index.php?mod=userlist" class="btn btn-default">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div> 