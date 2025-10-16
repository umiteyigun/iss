<?php

require_once __DIR__ . '/../models/MemberModel.php';

$action = $_GET['mod'] ?? 'memberlist';

switch ($action) {
    case 'newMember':
        showNewMemberForm();
        break;
    
    case 'doNewMember':
        createNewMember();
        break;

    case 'deleteMember':
        deleteMember();
        break;

    case 'editMember':
        showEditMemberForm();
        break;

    case 'doUpdateMember':
        updateMember();
        break;

    // case 'deleteMember': ...
    case 'memberlist':
    default:
        showMemberList();
        break;
}

function showNewMemberForm()
{
    $viewData = []; // No initial data needed for this form
    $viewFile = __DIR__ . '/../../views/newMember.php';
    require __DIR__ . '/../../views/layout.php';
}

function createNewMember()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: index.php?mod=newMember');
        exit();
    }

    // Basic validation
    if (empty($_POST['username']) || empty($_POST['password'])) {
        // Redirect back with error
        header('Location: index.php?mod=newMember&status=error&msg=Username and password are required.');
        exit();
    }
    
    // Handle file upload
    $photoName = 'default.jpg'; // Default photo
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] == 0) {
        $uploadDir = __DIR__ . '/../../public/Members/';
        // Ensure the directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $photoName = uniqid() . '_' . basename($_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photoName);
    }

    $data = [
        'username' => $_POST['username'],
        'password' => $_POST['password'],
        'name' => $_POST['name'] ?? '',
        'lastname' => $_POST['lastname'] ?? '',
        'tc' => $_POST['tc'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'photo' => $photoName,
        'mode' => $_POST['mode'] ?? 'Default' // Permissions
    ];

    $memberModel = new MemberModel();
    $success = $memberModel->createMember($data);

    if ($success) {
        header('Location: index.php?mod=memberlist&status=created');
        exit();
    } else {
        header('Location: index.php?mod=newMember&status=error&msg=Database error.');
        exit();
    }
}

function deleteMember()
{
    if (empty($_GET['id'])) {
        // No ID provided, redirect
        header('Location: index.php?mod=memberlist&status=error&msg=No member ID specified.');
        exit();
    }

    $id = (int)$_GET['id'];
    
    $memberModel = new MemberModel();
    $success = $memberModel->deleteMember($id);

    if ($success) {
        header('Location: index.php?mod=memberlist&status=deleted');
        exit();
    } else {
        header('Location: index.php?mod=memberlist&status=error&msg=Could not delete member.');
        exit();
    }
}

function showMemberList()
{
    $page = isset($_GET['p']) ? (int)$_GET['p'] : 1;
    $pageSize = 15;

    $memberModel = new MemberModel();

    $viewData = [
        'members' => $memberModel->getMembers($page, $pageSize),
        'totalMembers' => $memberModel->getMemberCount(),
        'page' => $page,
        'pageSize' => $pageSize
    ];

    $viewFile = __DIR__ . '/../../views/memberlist.php';
    require __DIR__ . '/../../views/layout.php';
}

function showEditMemberForm()
{
    if (empty($_GET['id'])) {
        header('Location: index.php?mod=memberlist&status=error&msg=No member ID specified.');
        exit();
    }

    $id = (int)$_GET['id'];
    $memberModel = new MemberModel();
    $member = $memberModel->getMemberById($id);

    if (!$member) {
        header('Location: index.php?mod=memberlist&status=error&msg=Member not found.');
        exit();
    }

    $viewData = ['member' => $member];
    $viewFile = __DIR__ . '/../../views/editMember.php';
    require __DIR__ . '/../../views/layout.php';
}

function updateMember()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id'])) {
        header('Location: index.php?mod=memberlist');
        exit();
    }

    $id = (int)$_POST['id'];
    
    // Handle file upload
    $photoName = ''; // Empty means don't update
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] == 0) {
        $uploadDir = __DIR__ . '/../../public/Members/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $photoName = uniqid() . '_' . basename($_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photoName);
    }

    $data = [
        'username' => $_POST['username'],
        'password' => $_POST['password'], // Model handles if this is empty
        'name' => $_POST['name'] ?? '',
        'lastname' => $_POST['lastname'] ?? '',
        'tc' => $_POST['tc'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'photo' => $photoName, // Pass the new photo name
        'mode' => $_POST['mode'] ?? 'Default'
    ];

    $memberModel = new MemberModel();
    $success = $memberModel->updateMember($id, $data);

    if ($success) {
        header('Location: index.php?mod=memberlist&status=updated');
        exit();
    } else {
        header('Location: index.php?mod=editMember&id=' . $id . '&status=error');
        exit();
    }
} 