(() => {
    const announcement = document.querySelector('.grab-announcement');
    const header = document.querySelector('.grab-header');
    const logo = document.querySelector('.grab-logo');

    // スマホのツールバー
    let mobileToolbar = document.querySelector('.grab-mobile-toolbar');
    const mobileToolbarHeight = mobileToolbar.offsetHeight;
    if (mobileToolbarHeight < 1) mobileToolbar = undefined;
    const mobileTopCategory = document.querySelector('.grab-mobile-top-category');
    
    // デスクトップのトップカテゴリ
    let desktopTopCategory = document.querySelector('.grab-desktop-top-category');
    const desktopTopCategoryHeight = desktopTopCategory.offsetHeight;
    if (desktopTopCategoryHeight < 1) desktopTopCategory = undefined;

    const announcementHeight = announcement.offsetHeight;
    const initialHeaderHeight = header.offsetHeight;
    const SCROLL_THRESHOLD = initialHeaderHeight + mobileToolbarHeight + desktopTopCategoryHeight + announcementHeight;

    // ヘッダの縦方向のパディング
    const PADDING_BLOCK_INIT = 20;
    const PADDING_BLOCK_MIN = 10;

    // ロゴの高さ
    const LOGO_HEIGHT_INIT = 90;
    const LOGO_HEIGHT_MIN = 45;

    const updateHeader = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const progress = Math.min(scrollY / SCROLL_THRESHOLD, 1);

        const logoHeight = LOGO_HEIGHT_INIT - (LOGO_HEIGHT_INIT - LOGO_HEIGHT_MIN) * progress;
        logo.style.height = logoHeight + 'px';

        // ヘッダの縦方向のパディング
        const paddingBlock = PADDING_BLOCK_INIT - (PADDING_BLOCK_INIT - PADDING_BLOCK_MIN) * progress;
        header.style.paddingBlock = paddingBlock + 'px';
        header.style.paddingInline = '20px';
        header.style.height = 'unset'
        
        const headerBottom = announcementHeight + header.offsetHeight;

        // デスクトップのトップカテゴリ
        if (desktopTopCategoryHeight) {
            desktopTopCategory.style.top = headerBottom + 'px';
            desktopTopCategory.style.position = 'fixed';
        }

        // スマホのツールバー
        if (mobileToolbar) {
            mobileToolbar.style.top = headerBottom + 'px';

            // スマホの MENS... のカテゴリも天井に張り付くようにする
            const toolbarBottom = headerBottom + mobileToolbarHeight;
            mobileTopCategory.style.top = toolbarBottom + 'px';
            mobileTopCategory.style.position = 'fixed';
        }
    };

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
})();