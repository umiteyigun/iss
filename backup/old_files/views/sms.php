<?php 
$user = $viewData['user']; 
?>

<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Send SMS to <?php echo htmlspecialchars($user['username']); ?></h3>
            </div>
            <form method="POST" action="index.php?mod=doSendSms">
                <input type="hidden" name="username" value="<?php echo htmlspecialchars($user['username']); ?>">

                <div class="box-body">

                    <?php if (isset($_GET['status'])): ?>
                        <?php if ($_GET['status'] == 'success'): ?>
                            <div class="alert alert-success">
                                SMS sent successfully! Message ID: <?php echo htmlspecialchars($_GET['msg_id']); ?>
                            </div>
                        <?php elseif ($_GET['status'] == 'error'): ?>
                            <div class="alert alert-danger">
                                SMS failed to send. Code: <?php echo htmlspecialchars($_GET['code']); ?> - 
                                Description: <?php echo htmlspecialchars($_GET['desc']); ?>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>


                    <div class="form-group">
                        <label for="phone_number">Phone Number</label>
                        <input type="text" class="form-control" id="phone_number" name="phone_number" 
                               value="<?php echo htmlspecialchars($user['phone1'] ?? ''); ?>" required>
                    </div>

                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea class="form-control" id="message" name="message" rows="5" required>Dear <?php echo htmlspecialchars($user['name'] . ' ' . $user['lastname']); ?>, </textarea>
                    </div>
                </div>

                <div class="box-footer">
                    <button type="submit" class="btn btn-primary pull-right">Send SMS</button>
                    <a href="index.php?mod=userlist" class="btn btn-default">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div> 