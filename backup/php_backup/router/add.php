<section class="content">
    <div class="row">
        <div class="col-xs-12 col-md-6 col-md-offset-3">
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title"><i class="fa fa-plus"></i> Add Router</h3>
                </div>
                <form method="post">
                    <div class="box-body">
                        <?php if (!empty($viewData['error'])): ?>
                            <div class="alert alert-danger"><?php echo $viewData['error']; ?></div>
                        <?php endif; ?>
                        <?php if (!empty($viewData['success'])): ?>
                            <div class="alert alert-success">Router başarıyla eklendi!</div>
                        <?php endif; ?>
                        <div class="form-group">
                            <label>IP Address (nasname) *</label>
                            <input type="text" name="nasname" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Name (shortname)</label>
                            <input type="text" name="shortname" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Username (ruser) *</label>
                            <input type="text" name="ruser" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Password (naspassword) *</label>
                            <input type="text" name="naspassword" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>RADIUS Secret *</label>
                            <input type="text" name="secret" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" name="description" class="form-control">
                        </div>
                    </div>
                    <div class="box-footer">
                        <button type="submit" class="btn btn-primary">Add Router</button>
                        <a href="index.php?mod=router" class="btn btn-default">Back to List</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section> 