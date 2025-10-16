<?php

require_once __DIR__ . '/../models/InvoiceModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../Router.php';

use App\Models\InvoiceModel;
use App\Models\UserModel;

session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: index.php?mod=login');
    exit();
}

$action = $_GET['mod'] ?? 'invoices';
$username = $_GET['username'] ?? null;
$invoiceId = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($action) {
    case 'invoices':
        listInvoices($username);
        break;
    case 'newInvoice':
        showNewInvoiceForm($username);
        break;
    case 'doNewInvoice':
        createInvoice();
        break;
    case 'editInvoice':
        showEditInvoiceForm($invoiceId);
        break;
    case 'doUpdateInvoice':
        updateInvoice();
        break;
    case 'deleteInvoice':
        deleteInvoice($invoiceId, $username);
        break;
    default:
        header('Location: index.php?mod=userlist');
        exit();
}

function listInvoices($username)
{
    if (!$username) {
        header('Location: index.php?mod=userlist');
        exit();
    }
    
    $userModel = new UserModel();
    $user = $userModel->getUserDetails($username);
    
    if (!$user) {
        header('Location: index.php?mod=userlist&error=notfound');
        exit();
    }
    
    $invoiceModel = new InvoiceModel();
    $invoices = $invoiceModel->getInvoicesForUser($username);

    $viewData = [
        'user' => $user,
        'invoices' => $invoices,
    ];

    $viewFile = __DIR__ . '/../../views/invoices.php';
    require __DIR__ . '/../../views/layout.php';
}

function showNewInvoiceForm($username)
{
    if (!$username) {
        header('Location: index.php?mod=userlist');
        exit();
    }

    $viewData = ['username' => $username];
    $viewFile = __DIR__ . '/../../views/newInvoice.php';
    require __DIR__ . '/../../views/layout.php';
}

function createInvoice()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: index.php?mod=userlist');
        exit();
    }

    $username = $_POST['username'];
    $data = [
        'username' => $username,
        'packet' => $_POST['packet'],
        'price' => $_POST['price'],
        'peydate' => $_POST['peydate'],
        'expire' => $_POST['expire'],
        'peymode' => $_POST['peymode'],
        'tdurum' => $_POST['tdurum'],
        'aciklama' => $_POST['aciklama'],
        'tyapan' => $_SESSION['username'] ?? 'admin',
    ];

    $invoiceModel = new InvoiceModel();
    $success = $invoiceModel->createInvoice($data);

    header('Location: index.php?mod=invoices&username=' . urlencode($username) . '&status=' . ($success ? 'created' : 'error'));
    exit();
}

function showEditInvoiceForm($invoiceId)
{
    if (!$invoiceId) {
        header('Location: index.php?mod=userlist');
        exit();
    }
    
    $invoiceModel = new InvoiceModel();
    $invoice = $invoiceModel->getInvoiceById($invoiceId);

    if (!$invoice) {
        header('Location: index.php?mod=userlist&error=invoicenotfound');
        exit();
    }
    
    $viewData = ['invoice' => $invoice];
    $viewFile = __DIR__ . '/../../views/editInvoice.php';
    require __DIR__ . '/../../views/layout.php';
}

function updateInvoice()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: index.php?mod=userlist');
        exit();
    }
    
    $invoiceId = (int)$_POST['id'];
    $username = $_POST['username'];
    $data = [
        'packet' => $_POST['packet'],
        'price' => $_POST['price'],
        'peydate' => $_POST['peydate'],
        'expire' => $_POST['expire'],
        'peymode' => $_POST['peymode'],
        'tdurum' => $_POST['tdurum'],
        'aciklama' => $_POST['aciklama'],
        'tyapan' => $_SESSION['username'] ?? 'admin',
    ];

    $invoiceModel = new InvoiceModel();
    $success = $invoiceModel->updateInvoice($invoiceId, $data);
    
    header('Location: index.php?mod=invoices&username=' . urlencode($username) . '&status=' . ($success ? 'updated' : 'error'));
    exit();
}

function deleteInvoice($invoiceId, $username)
{
    if (!$invoiceId || !$username) {
        header('Location: index.php?mod=userlist');
        exit();
    }
    
    $invoiceModel = new InvoiceModel();
    $success = $invoiceModel->deleteInvoice($invoiceId);

    header('Location: index.php?mod=invoices&username=' . urlencode($username) . '&status=' . ($success ? 'deleted' : 'error'));
    exit();
} 