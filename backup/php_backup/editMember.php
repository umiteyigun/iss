<div class="edit-member-container" style="max-width: 420px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(60,60,100,0.08); padding: 32px 28px;">
    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; text-align: center; letter-spacing: 0.5px;">Admin Bilgilerini Düzenle</h2>
    <form method="POST" action="index.php?mod=doUpdateMember" enctype="multipart/form-data" autocomplete="off">
        <input type="hidden" name="id" value="<?php echo htmlspecialchars($member['id']); ?>">

        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 24px;">
            <?php if (!empty($member['photo']) && file_exists(__DIR__ . '/../../public/Members/' . $member['photo'])): ?>
                <img src="public/Members/<?php echo htmlspecialchars($member['photo']); ?>" alt="Current Photo" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0; margin-bottom: 8px;">
            <?php else: ?>
                <div style="width: 72px; height: 72px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 2rem; margin-bottom: 8px;">
                    <i class="fa fa-user"></i>
                </div>
            <?php endif; ?>
            <label for="photo" style="font-size: 0.95rem; color: #555; cursor:pointer; margin-bottom: 0;">
                <input type="file" id="photo" name="photo" style="display:none;">
                <span style="color: #667eea; text-decoration: underline;">Fotoğrafı Değiştir</span>
            </label>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
            <label for="username" style="font-weight: 500;">Kullanıcı Adı*</label>
            <input type="text" class="form-control" id="username" name="username" value="<?php echo htmlspecialchars($member['username']); ?>" required style="border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 18px;">
            <label for="password" style="font-weight: 500;">Şifre</label>
            <input type="password" class="form-control" id="password" name="password" placeholder="Boş bırakılırsa değişmez" style="border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 18px;">
            <label for="name" style="font-weight: 500;">Ad</label>
            <input type="text" class="form-control" id="name" name="name" value="<?php echo htmlspecialchars($member['name']); ?>" style="border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 18px;">
            <label for="lastname" style="font-weight: 500;">Soyad</label>
            <input type="text" class="form-control" id="lastname" name="lastname" value="<?php echo htmlspecialchars($member['lastname']); ?>" style="border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 18px;">
            <label for="phone" style="font-weight: 500;">Telefon</label>
            <input type="text" class="form-control" id="phone" name="phone" value="<?php echo htmlspecialchars($member['phone']); ?>" style="border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 18px;">
            <label for="mode" style="font-weight: 500;">Yetki</label>
            <input type="text" class="form-control" id="mode" name="mode" value="<?php echo htmlspecialchars($member['mode']); ?>" style="border-radius: 8px;">
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 28px;">
            <button type="submit" class="btn btn-primary" style="border-radius: 8px; min-width: 120px;">Kaydet</button>
            <a href="index.php?mod=memberlist" class="btn btn-default" style="border-radius: 8px; min-width: 120px;">İptal</a>
        </div>
    </form>
</div> 