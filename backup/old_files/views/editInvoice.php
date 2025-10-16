<?php
$invoice = $viewData['invoice'];

// Helper to format date for datetime-local input
function formatDateTimeLocal($dateStr) {
    if (empty($dateStr)) return '';
    try {
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d\TH:i');
    } catch (Exception $e) {
        return '';
    }
}
?>

<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Edit Invoice #<?php echo htmlspecialchars($invoice['id']); ?> for <?php echo htmlspecialchars($invoice['username']); ?></h3>
            </div>
            <form method="POST" action="index.php?mod=doUpdateInvoice">
                <input type="hidden" name="id" value="<?php echo htmlspecialchars($invoice['id']); ?>">
                <input type="hidden" name="username" value="<?php echo htmlspecialchars($invoice['username']); ?>">

                <div class="box-body">
                    <div class="form-group">
                        <label for="packet">Packet/Description</label>
                        <input type="text" class="form-control" id="packet" name="packet" value="<?php echo htmlspecialchars($invoice['packet']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="price">Price</label>
                        <input type="number" step="0.01" class="form-control" id="price" name="price" value="<?php echo htmlspecialchars($invoice['price']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="peydate">Payment Date</label>
                        <input type="datetime-local" class="form-control" id="peydate" name="peydate" value="<?php echo formatDateTimeLocal($invoice['peydate']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="expire">Expiration Date</label>
                        <input type="datetime-local" class="form-control" id="expire" name="expire" value="<?php echo formatDateTimeLocal($invoice['expire']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="peymode">Payment Mode</label>
                        <input type="text" class="form-control" id="peymode" name="peymode" value="<?php echo htmlspecialchars($invoice['peymode']); ?>" placeholder="e.g., Cash, Credit Card">
                    </div>
                    <div class="form-group">
                        <label for="tdurum">Status</label>
                        <select class="form-control" id="tdurum" name="tdurum">
                            <option value="1" <?php echo ($invoice['tdurum'] == 1 ? 'selected' : ''); ?>>Paid</option>
                            <option value="0" <?php echo ($invoice['tdurum'] == 0 ? 'selected' : ''); ?>>Unpaid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="aciklama">Notes/Description</label>
                        <textarea class="form-control" id="aciklama" name="aciklama" rows="3"><?php echo htmlspecialchars($invoice['aciklama']); ?></textarea>
                    </div>
                </div>

                <div class="box-footer">
                    <button type="submit" class="btn btn-warning pull-right">Update Invoice</button>
                    <a href="index.php?mod=invoices&username=<?php echo htmlspecialchars($invoice['username']); ?>" class="btn btn-default">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div> 