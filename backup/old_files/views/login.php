<!DOCTYPE HTML>
<html>
<head>
<title>Login</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<link rel="stylesheet" href="public/bower_components/bootstrap/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="/css/login.css">
</head>
<body>

<div class="login-box">
    <!-- /.login-logo -->
    <div class="login-box-body">
        <?php if (isset($viewData['error']) && !empty($viewData['error'])): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($viewData['error']); ?></div>
        <?php endif; ?>

        <form action="/index.php?mod=dologin" method="post">
            <div class="form-group has-feedback">
                <input type="text" name="username" class="form-control" placeholder="Username" required>
                <span class="glyphicon glyphicon-envelope form-control-feedback"></span>
            </div>
            <div class="form-group has-feedback">
                <input type="password" name="password" class="form-control" placeholder="Password" required>
                <span class="glyphicon glyphicon-lock form-control-feedback"></span>
            </div>
            <div class="row">
                <div class="col-xs-8">
                    <!-- Optional: Remember Me Checkbox -->
                </div>
                <!-- /.col -->
                <div class="col-xs-4">
                    <button type="submit" class="btn btn-primary btn-block btn-flat">Sign In</button>
                </div>
                <!-- /.col -->
            </div>
        </form>
    </div>
    <!-- /.login-box-body -->
</div>
<!-- /.login-box -->

</body>
</html> 