<?php
$username = $viewData['username'];
?>

<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Create New Invoice for <?php echo htmlspecialchars($username); ?></h3>
            </div>
            <form method="POST" action="index.php?mod=doNewInvoice">
                <input type="hidden" name="username" value="<?php echo htmlspecialchars($username); ?>">

                <div class="box-body">
                    <div class="form-group">
                        <label for="packet">Packet/Description</label>
                        <input type="text" class="form-control" id="packet" name="packet" required>
                    </div>
                    <div class="form-group">
                        <label for="price">Price</label>
                        <input type="number" step="0.01" class="form-control" id="price" name="price" required>
                    </div>
                    <div class="form-group">
                        <label for="peydate">Payment Date</label>
                        <input type="datetime-local" class="form-control" id="peydate" name="peydate" value="<?php echo date('Y-m-d\TH:i'); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="expire">Expiration Date</label>
                        <input type="datetime-local" class="form-control" id="expire" name="expire" required>
                    </div>
                    <div class="form-group">
                        <label for="peymode">Payment Mode</label>
                        <input type="text" class="form-control" id="peymode" name="peymode" placeholder="e.g., Cash, Credit Card">
                    </div>
                    <div class="form-group">
                        <label for="tdurum">Status</label>
                        <select class="form-control" id="tdurum" name="tdurum">
                            <option value="1">Paid</option>
                            <option value="0" selected>Unpaid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="aciklama">Notes/Description</label>
                        <textarea class="form-control" id="aciklama" name="aciklama" rows="3"></textarea>
                    </div>
                </div>

                <div class="box-footer">
                    <button type="submit" class="btn btn-primary pull-right">Save Invoice</button>
                    <a href="index.php?mod=invoices&username=<?php echo htmlspecialchars($username); ?>" class="btn btn-default">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div> 