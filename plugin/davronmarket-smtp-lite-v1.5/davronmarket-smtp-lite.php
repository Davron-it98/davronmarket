<?php
/**
 * Plugin Name: DavronMarket SMTP Lite
 * Description: Gmail SMTP, branded emails, registration notifications, login alerts, and secure auth pages for DavronMarket.
 * Version: 2.0.0
 * Author: DavronMarket
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) exit;

if (class_exists('DavronMarket_SMTP_Lite_V200')) {
    return;
}

class DavronMarket_SMTP_Lite_V200 {
    const OPTION = 'dm_smtp_lite_settings';
    const DEFAULT_GMAIL = 'Davronmarket98@gmail.com';
    const DEFAULT_APP_PASSWORD = 'euyh itvb xijv jiba';

    public function __construct() {
        register_activation_hook(__FILE__, [$this, 'activate']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('phpmailer_init', [$this, 'configure_phpmailer']);
        add_filter('wp_mail_from', [$this, 'mail_from']);
        add_filter('wp_mail_from_name', [$this, 'mail_from_name']);
        add_filter('wp_mail_content_type', [$this, 'mail_content_type']);
        add_filter('retrieve_password_message', [$this, 'custom_reset_email'], 10, 4);
        add_action('init', [$this, 'handle_auth_routes']);
        add_action('template_redirect', [$this, 'route_wp_login']);
        add_action('user_register', [$this, 'handle_user_register'], 20, 1);
        add_action('wp_login', [$this, 'handle_user_login'], 20, 2);
        add_shortcode('davron_login', [$this, 'shortcode_login']);
        add_shortcode('davron_register', [$this, 'shortcode_register']);
        add_shortcode('davron_lostpassword', [$this, 'shortcode_lostpassword']);
        add_shortcode('davron_resetpass', [$this, 'shortcode_resetpass']);
        add_shortcode('davron_dashboard', [$this, 'shortcode_dashboard']);
        add_shortcode('davron_logout', [$this, 'shortcode_logout']);
    }

    public static function defaults() {
        return [
            'enable_smtp' => 1,
            'from_name' => 'DavronMarket',
            'from_email' => self::DEFAULT_GMAIL,
            'mailer' => 'smtp',
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => '587',
            'encryption' => 'tls',
            'smtp_auth' => 1,
            'smtp_username' => self::DEFAULT_GMAIL,
            'smtp_password' => self::DEFAULT_APP_PASSWORD,
            'debug' => 0,
            'test_email' => self::DEFAULT_GMAIL,
            'owner_email' => self::DEFAULT_GMAIL,
            'enable_html_template' => 1,
            'logo_url' => '',
            'email_heading' => 'DavronMarket',
            'email_footer' => 'Спасибо, что выбрали DavronMarket',
            'notify_user_on_register' => 1,
            'notify_owner_on_register' => 1,
            'notify_user_on_login' => 1,
            'notify_owner_on_login' => 1,
            'slug_dashboard' => 'dashboard',
            'slug_login' => 'login',
            'slug_logout' => 'logout',
            'slug_register' => 'register',
            'slug_lostpassword' => 'lostpassword',
            'slug_resetpass' => 'resetpass',
        ];
    }

    public static function get_settings() {
        return wp_parse_args(get_option(self::OPTION, []), self::defaults());
    }

    public function activate() {
        if (!get_option(self::OPTION)) {
            add_option(self::OPTION, self::defaults());
        }
        $this->maybe_create_pages();
        flush_rewrite_rules();
    }

    private function page_content_for($slug_key) {
        switch ($slug_key) {
            case 'slug_login': return '[davron_login]';
            case 'slug_register': return '[davron_register]';
            case 'slug_lostpassword': return '[davron_lostpassword]';
            case 'slug_resetpass': return '[davron_resetpass]';
            case 'slug_dashboard': return '[davron_dashboard]';
            case 'slug_logout': return '[davron_logout]';
            default: return '';
        }
    }

    private function page_title_for($slug_key) {
        switch ($slug_key) {
            case 'slug_login': return 'Войти';
            case 'slug_register': return 'Регистрация';
            case 'slug_lostpassword': return 'Забыли пароль';
            case 'slug_resetpass': return 'Сброс пароля';
            case 'slug_dashboard': return 'Личный кабинет';
            case 'slug_logout': return 'Выход';
            default: return 'DavronMarket';
        }
    }

    private function maybe_create_pages() {
        $s = self::get_settings();
        foreach (['slug_dashboard','slug_login','slug_logout','slug_register','slug_lostpassword','slug_resetpass'] as $key) {
            $slug = sanitize_title($s[$key] ?? '');
            if (!$slug) continue;
            $existing = get_page_by_path($slug);
            if ($existing) continue;
            wp_insert_post([
                'post_title' => $this->page_title_for($key),
                'post_name' => $slug,
                'post_status' => 'publish',
                'post_type' => 'page',
                'post_content' => $this->page_content_for($key),
            ]);
        }
    }

    public function admin_menu() {
        add_options_page('DavronMarket SMTP Lite', 'DavronMarket SMTP Lite', 'manage_options', 'davronmarket-smtp-lite', [$this, 'settings_page']);
    }

    public function register_settings() {
        register_setting(self::OPTION, self::OPTION, [$this, 'sanitize_settings']);
    }

    public function sanitize_settings($input) {
        $old = self::get_settings();
        $clean = self::defaults();
        $clean['enable_smtp'] = !empty($input['enable_smtp']) ? 1 : 0;
        $clean['from_name'] = sanitize_text_field($input['from_name'] ?? '');
        $clean['from_email'] = sanitize_email($input['from_email'] ?? '');
        $clean['mailer'] = in_array(($input['mailer'] ?? 'smtp'), ['smtp', 'mail'], true) ? $input['mailer'] : 'smtp';
        $clean['smtp_host'] = sanitize_text_field($input['smtp_host'] ?? '');
        $clean['smtp_port'] = preg_replace('/[^0-9]/', '', $input['smtp_port'] ?? '587');
        $clean['encryption'] = in_array(($input['encryption'] ?? 'tls'), ['none', 'tls', 'ssl'], true) ? $input['encryption'] : 'tls';
        $clean['smtp_auth'] = !empty($input['smtp_auth']) ? 1 : 0;
        $clean['smtp_username'] = sanitize_text_field($input['smtp_username'] ?? '');
        $clean['smtp_password'] = !empty($input['smtp_password']) ? $input['smtp_password'] : ($old['smtp_password'] ?? '');
        $clean['debug'] = !empty($input['debug']) ? 1 : 0;
        $clean['test_email'] = sanitize_email($input['test_email'] ?? '');
        $clean['owner_email'] = sanitize_email($input['owner_email'] ?? '');
        $clean['enable_html_template'] = !empty($input['enable_html_template']) ? 1 : 0;
        $clean['logo_url'] = esc_url_raw($input['logo_url'] ?? '');
        $clean['email_heading'] = sanitize_text_field($input['email_heading'] ?? '');
        $clean['email_footer'] = sanitize_text_field($input['email_footer'] ?? '');
        $clean['notify_user_on_register'] = !empty($input['notify_user_on_register']) ? 1 : 0;
        $clean['notify_owner_on_register'] = !empty($input['notify_owner_on_register']) ? 1 : 0;
        $clean['notify_user_on_login'] = !empty($input['notify_user_on_login']) ? 1 : 0;
        $clean['notify_owner_on_login'] = !empty($input['notify_owner_on_login']) ? 1 : 0;
        foreach (['slug_dashboard','slug_login','slug_logout','slug_register','slug_lostpassword','slug_resetpass'] as $key) {
            $clean[$key] = sanitize_title($input[$key] ?? self::defaults()[$key]);
        }
        $this->maybe_create_pages();
        flush_rewrite_rules();
        return $clean;
    }

    public function settings_page() {
        if (!current_user_can('manage_options')) return;
        $s = self::get_settings();
        $notice = '';
        if (isset($_POST['dm_send_test']) && check_admin_referer('dm_send_test_email')) {
            $to = sanitize_email($_POST['dm_test_email_now'] ?? $s['test_email']);
            $result = wp_mail($to, 'Тест SMTP с сайта DavronMarket', "Это тестовое письмо от плагина DavronMarket SMTP Lite.\n\nЕсли вы получили это письмо, SMTP настроен правильно.");
            if ($result) {
                $notice = '<div class="updated notice"><p>Тестовое письмо отправлено на '.esc_html($to).'.</p></div>';
            } else {
                global $phpmailer;
                $err = is_object($phpmailer) && !empty($phpmailer->ErrorInfo) ? $phpmailer->ErrorInfo : 'Не удалось отправить тестовое письмо. Проверьте SMTP-настройки и журнал ошибок сервера.';
                $notice = '<div class="error notice"><p>Не удалось отправить тестовое письмо.</p><p><strong>Причина:</strong> '.esc_html($err).'</p></div>';
            }
        }
        echo '<div class="wrap"><h1>DavronMarket SMTP Lite</h1>'.$notice;
        echo '<form method="post" action="options.php">';
        settings_fields(self::OPTION);
        echo '<table class="form-table" role="presentation">';
        $this->checkbox_row('enable_smtp', 'Включить SMTP', $s['enable_smtp']);
        $this->text_row('from_name', 'Имя отправителя', $s['from_name']);
        $this->email_row('from_email', 'Email отправителя', $s['from_email']);
        $this->select_row('mailer', 'Способ отправки', $s['mailer'], ['smtp'=>'SMTP','mail'=>'PHP mail()']);
        $this->text_row('smtp_host', 'SMTP Host', $s['smtp_host']);
        $this->text_row('smtp_port', 'SMTP Port', $s['smtp_port']);
        $this->select_row('encryption', 'Шифрование', $s['encryption'], ['none'=>'None','tls'=>'TLS','ssl'=>'SSL']);
        $this->checkbox_row('smtp_auth', 'SMTP Authentication', $s['smtp_auth']);
        $this->text_row('smtp_username', 'SMTP Username', $s['smtp_username']);
        $this->password_row('smtp_password', 'SMTP Password', 'Оставьте пустым, чтобы сохранить текущий пароль.');
        $this->checkbox_row('debug', 'SMTP Debug', $s['debug']);
        $this->email_row('owner_email', 'Email владельца', $s['owner_email']);
        echo '<tr><th colspan="2"><h2>HTML шаблон</h2></th></tr>';
        $this->checkbox_row('enable_html_template', 'Включить HTML-шаблон', $s['enable_html_template']);
        $this->text_row('logo_url', 'URL логотипа', $s['logo_url']);
        $this->text_row('email_heading', 'Текст в шапке', $s['email_heading']);
        $this->text_row('email_footer', 'Текст внизу письма', $s['email_footer']);
        echo '<tr><th colspan="2"><h2>Автоматические уведомления</h2></th></tr>';
        $this->checkbox_row('notify_user_on_register', 'Письмо пользователю после регистрации', $s['notify_user_on_register']);
        $this->checkbox_row('notify_owner_on_register', 'Письмо владельцу о регистрации', $s['notify_owner_on_register']);
        $this->checkbox_row('notify_user_on_login', 'Письмо пользователю при входе', $s['notify_user_on_login']);
        $this->checkbox_row('notify_owner_on_login', 'Письмо владельцу о входе', $s['notify_owner_on_login']);
        echo '<tr><th colspan="2"><h2>Страницы</h2></th></tr>';
        foreach ([
            'slug_dashboard'=>'Консоль',
            'slug_login'=>'Войти',
            'slug_logout'=>'Выйти',
            'slug_register'=>'Регистрация',
            'slug_lostpassword'=>'Забыли пароль',
            'slug_resetpass'=>'Задать пароль',
        ] as $key=>$label) {
            echo '<tr><th scope="row"><label for="'.$key.'">'.esc_html($label).'</label></th><td>';
            echo '<input class="regular-text" type="text" id="'.$key.'" name="'.self::OPTION.'['.$key.']" value="'.esc_attr($s[$key]).'" />';
            echo '<p class="description"><a href="'.esc_url(home_url('/'.$s[$key].'/')).'" target="_blank">'.esc_html(home_url('/'.$s[$key].'/')).'</a></p>';
            echo '</td></tr>';
        }
        echo '</table>';
        submit_button('Сохранить настройки');
        echo '</form>';
        echo '<hr><h2>Тестовое письмо</h2><form method="post">';
        wp_nonce_field('dm_send_test_email');
        echo '<input type="email" class="regular-text" name="dm_test_email_now" value="'.esc_attr($s['test_email']).'" placeholder="email@example.com" required /> ';
        submit_button('Отправить тестовое письмо', 'secondary', 'dm_send_test', false);
        echo '</form>';
        echo '<p><strong>Подсказка для Gmail:</strong> smtp.gmail.com / 587 / TLS / username = ваш Gmail / password = App Password.</p>';
        echo '<p><strong>Готово для DavronMarket:</strong> по умолчанию уже подставлены Gmail и App Password, но при необходимости вы можете их изменить.</p>';
        echo '</div>';
    }

    private function text_row($key, $label, $value) {
        echo '<tr><th scope="row"><label for="'.$key.'">'.esc_html($label).'</label></th><td><input class="regular-text" type="text" id="'.$key.'" name="'.self::OPTION.'['.$key.']" value="'.esc_attr($value).'" /></td></tr>';
    }
    private function email_row($key, $label, $value) {
        echo '<tr><th scope="row"><label for="'.$key.'">'.esc_html($label).'</label></th><td><input class="regular-text" type="email" id="'.$key.'" name="'.self::OPTION.'['.$key.']" value="'.esc_attr($value).'" /></td></tr>';
    }
    private function password_row($key, $label, $desc='') {
        echo '<tr><th scope="row"><label for="'.$key.'">'.esc_html($label).'</label></th><td><input class="regular-text" type="password" id="'.$key.'" name="'.self::OPTION.'['.$key.']" value="" />';
        if ($desc) echo '<p class="description">'.esc_html($desc).'</p>';
        echo '</td></tr>';
    }
    private function checkbox_row($key, $label, $checked) {
        echo '<tr><th scope="row">'.esc_html($label).'</th><td><label><input type="checkbox" name="'.self::OPTION.'['.$key.']" value="1" '.checked($checked, 1, false).' /> '.esc_html($label).'</label></td></tr>';
    }
    private function select_row($key, $label, $current, $options) {
        echo '<tr><th scope="row"><label for="'.$key.'">'.esc_html($label).'</label></th><td><select id="'.$key.'" name="'.self::OPTION.'['.$key.']">';
        foreach ($options as $v=>$l) echo '<option value="'.esc_attr($v).'" '.selected($current, $v, false).'>'.esc_html($l).'</option>';
        echo '</select></td></tr>';
    }

    public function configure_phpmailer($phpmailer) {
        $s = self::get_settings();
        if (empty($s['enable_smtp']) || $s['mailer'] !== 'smtp') return;
        $phpmailer->isSMTP();
        $phpmailer->Host = $s['smtp_host'];
        $phpmailer->Port = (int)$s['smtp_port'];
        if ($s['encryption'] !== 'none') $phpmailer->SMTPSecure = $s['encryption'];
        $phpmailer->SMTPAuth = !empty($s['smtp_auth']);
        $phpmailer->Username = $s['smtp_username'];
        $phpmailer->Password = $s['smtp_password'];
        $phpmailer->CharSet = 'UTF-8';
        if (!empty($s['debug']) && current_user_can('manage_options')) {
            $phpmailer->SMTPDebug = 2;
        }
    }

    public function mail_from($email) {
        $s = self::get_settings();
        return !empty($s['from_email']) ? $s['from_email'] : $email;
    }

    public function mail_from_name($name) {
        $s = self::get_settings();
        return !empty($s['from_name']) ? $s['from_name'] : $name;
    }

    public function mail_content_type($type) {
        $s = self::get_settings();
        return !empty($s['enable_html_template']) ? 'text/html' : $type;
    }

    private function wrap_email($content) {
        $s = self::get_settings();
        if (empty($s['enable_html_template'])) {
            return nl2br(esc_html($content));
        }
        $logo = !empty($s['logo_url']) ? '<img src="'.esc_url($s['logo_url']).'" alt="logo" style="max-width:180px;height:auto;margin-bottom:20px;">' : '';
        return '<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,sans-serif;color:#222;">'
            .'<div style="max-width:640px;margin:0 auto;padding:30px 15px;">'
            .'<div style="background:#fff;border-radius:18px;padding:36px 28px;box-shadow:0 8px 30px rgba(0,0,0,.06);text-align:center;">'
            .$logo
            .'<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">'.esc_html($s['email_heading']).'</h1>'
            .'<div style="text-align:left;font-size:16px;line-height:1.7;color:#333;margin-top:24px;">'.$content.'</div>'
            .'<div style="margin-top:28px;padding-top:18px;border-top:1px solid #ececec;color:#666;font-size:14px;">'.esc_html($s['email_footer']).'</div>'
            .'</div></div></body></html>';
    }

    public function custom_reset_email($message, $key, $user_login, $user_data) {
        $s = self::get_settings();
        $url = add_query_arg([
            'key' => rawurlencode($key),
            'login' => rawurlencode($user_login),
        ], home_url('/'.$s['slug_resetpass'].'/'));
        $body = '<p>Здравствуйте!</p>'
              . '<p>Кто-то запросил сброс пароля для вашей учётной записи на сайте DavronMarket.</p>'
              . '<p><strong>Имя пользователя:</strong> '.esc_html($user_login).'</p>'
              . '<p><a href="'.esc_url($url).'" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:10px;">Сбросить пароль</a></p>'
              . '<p>Если это были не вы, просто проигнорируйте это письмо.</p>';
        return $this->wrap_email($body);
    }

    private function get_user_phone($user_id) {
        $candidates = ['phone', 'billing_phone', 'dm_phone', 'telephone'];
        foreach ($candidates as $key) {
            $value = trim((string) get_user_meta($user_id, $key, true));
            if ($value !== '') return $value;
        }
        return '';
    }

    private function get_reset_url_for_user($user) {
        $s = self::get_settings();
        $key = get_password_reset_key($user);
        if (is_wp_error($key)) {
            return home_url('/'.$s['slug_lostpassword'].'/');
        }
        return add_query_arg([
            'key' => rawurlencode($key),
            'login' => rawurlencode($user->user_login),
        ], home_url('/'.$s['slug_resetpass'].'/'));
    }

    private function send_html_mail($to, $subject, $body) {
        if (!$to) return false;
        return wp_mail($to, $subject, $this->wrap_email($body), ['Content-Type: text/html; charset=UTF-8']);
    }

    public function handle_user_register($user_id) {
        $user = get_user_by('ID', $user_id);
        if (!$user) return;

        $first_name = sanitize_text_field($_POST['dm_name'] ?? '');
        $last_name = sanitize_text_field($_POST['dm_lastname'] ?? '');
        $fallback_full_name = sanitize_text_field($_POST['full_name'] ?? '');
        $full_name = trim($first_name.' '.$last_name);
        if ($full_name === '') {
            $full_name = $fallback_full_name;
        }
        $phone = sanitize_text_field($_POST['phone'] ?? '');
        if ($full_name !== '') {
            $update_data = [
                'ID' => $user_id,
                'display_name' => $full_name,
            ];
            if ($first_name !== '') {
                $update_data['first_name'] = $first_name;
            } elseif ($fallback_full_name !== '') {
                $update_data['first_name'] = $fallback_full_name;
            }
            if ($last_name !== '') {
                $update_data['last_name'] = $last_name;
            }
            wp_update_user($update_data);
        }
        if ($phone !== '') {
            update_user_meta($user_id, 'phone', $phone);
        }

        $s = self::get_settings();
        $display_name = $full_name !== '' ? $full_name : ($user->display_name ?: $user->user_login);
        $user_phone = $phone !== '' ? $phone : $this->get_user_phone($user_id);
        $login_url = home_url('/'.$s['slug_login'].'/');
        $reset_url = $this->get_reset_url_for_user($user);
        $registered_at = wp_date('d.m.Y H:i:s');

        if (!empty($s['notify_user_on_register'])) {
            $body = '<p>Здравствуйте, <strong>'.esc_html($display_name).'</strong>!</p>'
                . '<p>Спасибо за регистрацию на DavronMarket.</p>'
                . '<p><strong>Ваши данные:</strong></p>'
                . '<ul>'
                . '<li><strong>Имя:</strong> '.esc_html($display_name).'</li>'
                . '<li><strong>Телефон:</strong> '.esc_html($user_phone ?: 'Не указан').'</li>'
                . '<li><strong>Email:</strong> '.esc_html($user->user_email).'</li>'
                . '</ul>'
                . '<p><a href="'.esc_url($login_url).'" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:10px;margin-right:10px;">Войти</a>'
                . '<a href="'.esc_url($reset_url).'" style="display:inline-block;padding:12px 18px;background:#f5c842;color:#111;text-decoration:none;border-radius:10px;">Сменить пароль</a></p>'
                . '<p>Пароль не отправляется по почте в целях безопасности.</p>';
            $this->send_html_mail($user->user_email, 'Добро пожаловать в DavronMarket', $body);
        }

        if (!empty($s['notify_owner_on_register']) && !empty($s['owner_email'])) {
            $body = '<p>На сайте зарегистрировался новый пользователь.</p>'
                . '<ul>'
                . '<li><strong>Имя:</strong> '.esc_html($display_name).'</li>'
                . '<li><strong>Телефон:</strong> '.esc_html($user_phone ?: 'Не указан').'</li>'
                . '<li><strong>Email:</strong> '.esc_html($user->user_email).'</li>'
                . '<li><strong>Логин:</strong> '.esc_html($user->user_login).'</li>'
                . '<li><strong>Время регистрации:</strong> '.esc_html($registered_at).'</li>'
                . '</ul>';
            $this->send_html_mail($s['owner_email'], 'Новая регистрация на DavronMarket', $body);
        }
    }

    public function handle_user_login($user_login, $user) {
        if (!$user || !($user instanceof WP_User)) return;
        $s = self::get_settings();
        $ip = sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $when = wp_date('d.m.Y H:i:s');
        $display_name = $user->display_name ?: $user->user_login;

        if (!empty($s['notify_user_on_login'])) {
            $reset_url = $this->get_reset_url_for_user($user);
            $body = '<p>Здравствуйте, <strong>'.esc_html($display_name).'</strong>.</p>'
                . '<p>Только что был выполнен вход в ваш аккаунт DavronMarket.</p>'
                . '<ul>'
                . '<li><strong>Время:</strong> '.esc_html($when).'</li>'
                . '<li><strong>IP:</strong> '.esc_html($ip).'</li>'
                . '</ul>'
                . '<p>Если это были не вы — срочно смените пароль.</p>'
                . '<p><a href="'.esc_url($reset_url).'" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:10px;">Сменить пароль</a></p>';
            $this->send_html_mail($user->user_email, 'Вход в аккаунт DavronMarket', $body);
        }

        if (!empty($s['notify_owner_on_login']) && !empty($s['owner_email'])) {
            $body = '<p>Пользователь вошёл в аккаунт на сайте.</p>'
                . '<ul>'
                . '<li><strong>Имя:</strong> '.esc_html($display_name).'</li>'
                . '<li><strong>Email:</strong> '.esc_html($user->user_email).'</li>'
                . '<li><strong>Логин:</strong> '.esc_html($user_login).'</li>'
                . '<li><strong>Время:</strong> '.esc_html($when).'</li>'
                . '<li><strong>IP:</strong> '.esc_html($ip).'</li>'
                . '</ul>';
            $this->send_html_mail($s['owner_email'], 'Вход пользователя на DavronMarket', $body);
        }
    }

    private function alert($text, $type='error') {
        $class = $type === 'success' ? 'ok' : 'err';
        return '<div class="dm-auth-alert '.$class.'">'.wp_kses_post($text).'</div>';
    }

    private function make_username($email, $first_name = '', $last_name = '') {
        $base = sanitize_user(trim($first_name.' '.$last_name), true);
        if ($base === '') {
            $base = sanitize_user(strstr($email, '@', true) ?: $email, true);
        }
        if ($base === '') {
            $base = 'user';
        }
        $username = $base;
        $i = 1;
        while (username_exists($username)) {
            $username = $base.$i;
            $i++;
        }
        return $username;
    }

    private function brand_logo_html() {
        $home = esc_url(home_url('/'));
        return '<a href="'.$home.'" class="dm-auth-logo">'
            . '<div class="dm-auth-logo-ic"><svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg></div>'
            . '<span class="dm-auth-logo-n">DavronMarket</span>'
            . '</a>';
    }

    private function themed_auth_shell($content, $max_width = '460px') {
        $logo = $this->brand_logo_html();
        $max_width = esc_attr($max_width);
        return <<<HTML
<style>
.dm-auth-ui{--bg:#050507;--gold:#f5c842;--gold2:#ffe066;--orange:#ff6b2b;--green:#4ade80;--red:#ff4757;--blue:#2b9cff;--purple:#a855f7;--white:#fff;--muted:rgba(255,255,255,.4);--border:rgba(255,255,255,.07);--g1:linear-gradient(135deg,#f5c842,#ff6b2b);--r:14px;position:relative;min-height:100vh;margin:calc(50% - 50vw);width:100vw;background:var(--bg);color:var(--white);font-family:'Syne',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;cursor:none;overflow:hidden}
.dm-auth-ui *,.dm-auth-ui *::before,.dm-auth-ui *::after{box-sizing:border-box}
.dm-auth-ui .grid{position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 20%,transparent 100%)}
.dm-auth-ui .glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse 55% 50% at 50% 50%,rgba(245,200,66,.06) 0%,transparent 70%)}
.dm-auth-ui #cur{width:12px;height:12px;border-radius:50%;background:var(--gold);position:fixed;top:0;left:0;z-index:9999;pointer-events:none;transform:translate(-50%,-50%);mix-blend-mode:difference;transition:width .2s,height .2s}
.dm-auth-ui #cur2{width:36px;height:36px;border-radius:50%;border:1px solid rgba(245,200,66,.4);position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transform:translate(-50%,-50%)}
.dm-auth-ui .wrap{position:relative;z-index:1;width:100%;max-width:{$max_width};animation:dmup .55s cubic-bezier(.22,1,.36,1) both}
@keyframes dmup{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.dm-auth-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:32px}.dm-auth-logo-ic{width:44px;height:44px;border-radius:12px;background:var(--g1);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(245,200,66,.35)}.dm-auth-logo-ic svg{width:22px;height:22px;fill:#000}.dm-auth-logo-n{font-family:'Unbounded',sans-serif;font-size:16px;font-weight:900;background:var(--g1);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.04em}
.dm-auth-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:4px;border:1px solid rgba(245,200,66,.25);background:rgba(245,200,66,.06);font-size:10px;font-weight:700;color:var(--gold2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:22px}.dm-auth-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:dmblink 2s infinite}@keyframes dmblink{0%,100%{opacity:1}50%{opacity:.3}}
.dm-auth-card{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:20px;padding:40px;position:relative;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6)}.dm-auth-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--g1)}
.dm-auth-card h1,.dm-auth-h1{font-family:'Unbounded',sans-serif;font-size:22px;font-weight:900;letter-spacing:-.5px;margin:0 0 8px}.dm-auth-card h1 em,.dm-auth-h1 em{font-style:normal;background:var(--g1);-webkit-background-clip:text;background-clip:text;color:transparent}
.dm-auth-sub{font-size:13px;color:var(--muted);margin-bottom:28px;line-height:1.6}.dm-auth-alert{border-radius:10px;padding:12px 14px;font-size:13px;font-weight:600;margin-bottom:20px;display:flex;gap:8px}.dm-auth-alert.err{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.25);color:#ff7b86}.dm-auth-alert.ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);color:#86efac}
.dm-auth-field{margin-bottom:18px}.dm-auth-field label{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.dm-auth-row2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.dm-auth-iw{position:relative}.dm-auth-iw svg.dm-auth-ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:15px;height:15px;stroke:rgba(255,255,255,.22);pointer-events:none}
.dm-auth-ui input{width:100%;padding:13px 42px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-family:'Syne',sans-serif;font-size:14px;color:var(--white);outline:none;-webkit-appearance:none;transition:border-color .2s,background .2s,box-shadow .2s}.dm-auth-ui input::placeholder{color:rgba(255,255,255,.18)}.dm-auth-ui input:focus{border-color:rgba(245,200,66,.5);background:rgba(245,200,66,.04);box-shadow:0 0 0 3px rgba(245,200,66,.08)}
.dm-auth-eye{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:none;color:rgba(255,255,255,.25);display:flex;transition:color .2s}.dm-auth-eye svg{width:15px;height:15px}.dm-auth-eye:hover{color:var(--gold)}
.dm-auth-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:var(--g1);color:#000;border:none;border-radius:var(--r);font-family:'Unbounded',sans-serif;font-size:11px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;cursor:none;box-shadow:0 8px 28px rgba(245,200,66,.3);transition:transform .2s,box-shadow .2s;margin-top:8px;text-decoration:none}.dm-auth-btn:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(245,200,66,.45)}.dm-auth-btn:active{transform:scale(.97)}.dm-auth-btn:disabled{opacity:.35;box-shadow:none}.dm-auth-btn svg{width:14px;height:14px}
.dm-auth-links{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:16px}.dm-auth-links a,.dm-auth-foot a,.dm-auth-back{font-size:12px;color:rgba(245,200,66,.8);text-decoration:none;font-weight:600;transition:color .2s}.dm-auth-links a:hover,.dm-auth-foot a:hover,.dm-auth-back:hover{color:var(--gold2)}.dm-auth-foot{text-align:center;margin-top:22px;font-size:12px;color:var(--muted)}.dm-auth-foot a{color:var(--gold);font-weight:700}.dm-auth-back{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:22px}.dm-auth-back svg{width:13px;height:13px}
.dm-auth-icon-box{width:60px;height:60px;border-radius:14px;background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.2);display:flex;align-items:center;justify-content:center;margin-bottom:20px}.dm-auth-icon-box svg{width:28px;height:28px;stroke:var(--gold)}
.dm-auth-sbar{height:3px;background:rgba(255,255,255,.07);border-radius:2px;margin-top:8px;overflow:hidden}.dm-auth-sfill{height:100%;width:0%;border-radius:2px;transition:width .3s,background .3s}.dm-auth-stext,.dm-auth-match{font-size:11px;margin-top:6px;min-height:14px;font-weight:600;color:rgba(255,255,255,.3)}.dm-auth-match.ok{color:var(--green)}.dm-auth-match.no{color:var(--red)}
.dm-auth-reqs{display:flex;flex-direction:column;gap:6px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-bottom:16px}.dm-auth-req{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,.3)}.dm-auth-req.ok{color:var(--green)}.dm-auth-rdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0}.dm-auth-req.ok .dm-auth-rdot{background:var(--green);box-shadow:0 0 6px var(--green)}
.dm-auth-terms{font-size:12px;color:rgba(255,255,255,.3);margin-bottom:4px;line-height:1.6}.dm-auth-terms a{color:rgba(245,200,66,.7);text-decoration:none;font-weight:600}
.dm-auth-sent{text-align:center}.dm-auth-emoji{font-size:52px;display:block;margin-bottom:18px}
@media(max-width:480px){.dm-auth-ui .dm-auth-card{padding:28px 20px}.dm-auth-ui .dm-auth-card h1,.dm-auth-ui .dm-auth-h1{font-size:19px}.dm-auth-ui .dm-auth-row2{grid-template-columns:1fr}.dm-auth-ui input{font-size:16px}}
</style>
<div class="dm-auth-ui">
  <div class="grid"></div>
  <div class="glow"></div>
  <div id="cur"></div>
  <div id="cur2"></div>
  <div class="wrap">
    {$logo}
    {$content}
  </div>
</div>
<script>
(function(){
  var root=document.currentScript.previousElementSibling;if(!root)return;
  var c=root.querySelector('#cur'),c2=root.querySelector('#cur2');
  if(!c||!c2)return;
  var mx=0,my=0,cx=0,cy=0;
  root.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;c.style.left=mx+'px';c.style.top=my+'px';});
  (function loop(){cx+=(mx-cx)*.15;cy+=(my-cy)*.15;c2.style.left=cx+'px';c2.style.top=cy+'px';requestAnimationFrame(loop);}());
  root.querySelectorAll('a,button,input,.stat,.mc').forEach(function(el){el.addEventListener('mouseenter',function(){c.style.width='20px';c.style.height='20px';c2.style.width='52px';c2.style.height='52px';});el.addEventListener('mouseleave',function(){c.style.width='12px';c.style.height='12px';c2.style.width='36px';c2.style.height='36px';});});
}());
</script>
HTML;
    }

    public function route_wp_login() {
        if (!isset($_SERVER['REQUEST_URI'])) return;
        $path = wp_parse_url(home_url($_SERVER['REQUEST_URI']), PHP_URL_PATH);
        if ($path !== '/wp-login.php') return;
        $s = self::get_settings();
        $action = sanitize_text_field($_GET['action'] ?? 'login');
        if ($action === 'register') wp_safe_redirect(home_url('/'.$s['slug_register'].'/'));
        elseif ($action === 'lostpassword' || $action === 'retrievepassword') wp_safe_redirect(home_url('/'.$s['slug_lostpassword'].'/'));
        elseif ($action === 'rp' || $action === 'resetpass') {
            $url = add_query_arg([
                'key' => rawurlencode($_GET['key'] ?? ''),
                'login' => rawurlencode($_GET['login'] ?? ''),
            ], home_url('/'.$s['slug_resetpass'].'/'));
            wp_safe_redirect($url);
        } else {
            wp_safe_redirect(home_url('/'.$s['slug_login'].'/'));
        }
        exit;
    }

    public function handle_auth_routes() {
        if (isset($_GET['dm_action']) && $_GET['dm_action'] === 'logout') {
            wp_logout();
            $s = self::get_settings();
            wp_safe_redirect(home_url('/'.$s['slug_login'].'/?logged_out=1'));
            exit;
        }
    }

    public function shortcode_login() {
        $s = self::get_settings();
        $msg = '';
        if (is_user_logged_in()) {
            wp_safe_redirect(home_url('/'.$s['slug_dashboard'].'/')); exit;
        }
        if (!empty($_GET['logged_out'])) $msg .= $this->alert('Вы вышли из аккаунта.', 'success');
        if (!empty($_GET['registered'])) $msg .= $this->alert('Регистрация прошла успешно. Теперь войдите в аккаунт.', 'success');
        if (!empty($_GET['reset'])) $msg .= $this->alert('Пароль успешно изменён. Теперь войдите в аккаунт.', 'success');
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['dm_login_nonce']) && wp_verify_nonce($_POST['dm_login_nonce'], 'dm_login')) {
            $creds = [
                'user_login' => sanitize_text_field($_POST['log'] ?? ''),
                'user_password' => $_POST['pwd'] ?? '',
                'remember' => !empty($_POST['rememberme']),
            ];
            $user = wp_signon($creds, false);
            if (is_wp_error($user)) {
                $msg .= $this->alert('Неверный логин или пароль.');
            } else {
                wp_safe_redirect(home_url('/'.$s['slug_dashboard'].'/')); exit;
            }
        }
        $alert = $msg;
        $content = '<div class="dm-auth-badge"><span class="dm-auth-dot"></span>Безопасный вход</div>'
            . '<div class="dm-auth-card">'
            . '<h1>Войти в <em>аккаунт</em></h1>'
            . '<p class="dm-auth-sub">Введите данные для входа на платформу</p>'
            . $alert
            . '<form method="post">'.wp_nonce_field('dm_login', 'dm_login_nonce', true, false)
            . '<div class="dm-auth-field"><label>Email или логин</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" name="log" placeholder="your@email.com" required autocomplete="username"></div></div>'
            . '<div class="dm-auth-field"><label>Пароль</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input type="password" id="dm-login-pass" name="pwd" placeholder="••••••••" required autocomplete="current-password"><button type="button" class="dm-auth-eye" onclick="var i=document.getElementById(\'dm-login-pass\');i.type=i.type===\'text\'?\'password\':\'text\';this.style.color=i.type===\'text\'?\'var(--gold)\':\''"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>'
            . '<button type="submit" class="dm-auth-btn">Войти <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>'
            . '<div class="dm-auth-links"><a href="'.esc_url(home_url('/'.$s['slug_lostpassword'].'/')).'">Забыли пароль?</a><a href="'.esc_url(home_url('/'.$s['slug_register'].'/')).'">Создать аккаунт →</a></div>'
            . '</form></div><p class="dm-auth-foot">Нет аккаунта? <a href="'.esc_url(home_url('/'.$s['slug_register'].'/')).'">Зарегистрироваться бесплатно</a></p>';
        return $this->themed_auth_shell($content);
    }

    public function shortcode_register() {
        $s = self::get_settings();
        $msg = '';
        if (is_user_logged_in()) { wp_safe_redirect(home_url('/'.$s['slug_dashboard'].'/')); exit; }
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['dm_register_nonce']) && wp_verify_nonce($_POST['dm_register_nonce'], 'dm_register')) {
            $first_name = sanitize_text_field($_POST['dm_name'] ?? '');
            $last_name = sanitize_text_field($_POST['dm_lastname'] ?? '');
            $email = sanitize_email($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $username = $this->make_username($email, $first_name, $last_name);
            if (!$username || !$email || !$password) $msg .= $this->alert('Заполните все поля.');
            elseif (username_exists($username)) $msg .= $this->alert('Такой логин уже существует.');
            elseif (email_exists($email)) $msg .= $this->alert('Такой email уже зарегистрирован.');
            else {
                $user_id = wp_create_user($username, $password, $email);
                if (is_wp_error($user_id)) $msg .= $this->alert($user_id->get_error_message());
                else { wp_safe_redirect(home_url('/'.$s['slug_login'].'/?registered=1')); exit; }
            }
        }
        $content = '<div class="dm-auth-badge"><span class="dm-auth-dot"></span>Регистрация бесплатна</div>'
            . '<div class="dm-auth-card">'
            . '<h1>Создать <em>аккаунт</em></h1>'
            . '<p class="dm-auth-sub">Займёт меньше минуты — и вы на платформе</p>'
            . $msg
            . '<form method="post">'.wp_nonce_field('dm_register', 'dm_register_nonce', true, false)
            . '<div class="dm-auth-row2">'
            . '<div class="dm-auth-field"><label>Имя</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" name="dm_name" placeholder="Даврон" required></div></div>'
            . '<div class="dm-auth-field"><label>Фамилия</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" name="dm_lastname" placeholder="Маркетов"></div></div>'
            . '</div>'
            . '<div class="dm-auth-field"><label>Email</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" name="email" placeholder="your@email.com" required autocomplete="email"></div></div>'
            . '<div class="dm-auth-field"><label>Пароль</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input type="password" id="dm-reg-pass" name="password" placeholder="Минимум 6 символов" required autocomplete="new-password" oninput="dmRegChk(this.value)"><button type="button" class="dm-auth-eye" onclick="var i=document.getElementById(\'dm-reg-pass\');i.type=i.type===\'text\'?\'password\':\'text\';this.style.color=i.type===\'text\'?\'var(--gold)\':\''"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="dm-auth-sbar"><div class="dm-auth-sfill" id="dm-reg-fill"></div></div><div class="dm-auth-stext" id="dm-reg-text">Введите пароль</div></div>'
            . '<p class="dm-auth-terms">Нажимая «Создать аккаунт», вы принимаете <a href="#">условия</a> и <a href="#">политику</a>.</p>'
            . '<button type="submit" class="dm-auth-btn">Создать аккаунт <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>'
            . '</form></div><p class="dm-auth-foot">Уже есть аккаунт? <a href="'.esc_url(home_url('/'.$s['slug_login'].'/')).'">Войти →</a></p>'
            . '<script>var dmRegMap=[{w:"0%",c:"",t:"Введите пароль"},{w:"25%",c:"#ff4757",t:"Слабый"},{w:"50%",c:"#f59e0b",t:"Средний"},{w:"75%",c:"#3b82f6",t:"Хороший"},{w:"100%",c:"#4ade80",t:"Надёжный"}];function dmRegChk(v){var s=0;if(v.length>=6)s++;if(v.length>=10)s++;if(/[A-Z0-9]/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;var m=dmRegMap[s]||dmRegMap[0];document.getElementById("dm-reg-fill").style.cssText="width:"+m.w+";background:"+m.c;document.getElementById("dm-reg-text").textContent=m.t;document.getElementById("dm-reg-text").style.color=m.c||"rgba(255,255,255,.3)";}</script>';
        return $this->themed_auth_shell($content, '480px');
    }

    public function shortcode_lostpassword() {
        $s = self::get_settings();
        $msg = '';
        $sent_to = '';
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['dm_lost_nonce']) && wp_verify_nonce($_POST['dm_lost_nonce'], 'dm_lost')) {
            $login = sanitize_text_field($_POST['user_login'] ?? '');
            $result = retrieve_password($login);
            if (is_wp_error($result)) $msg .= $this->alert('Не удалось отправить письмо. Проверьте email или логин.');
            else $sent_to = $login;
        }
        if ($sent_to) {
            $content = '<div class="dm-auth-card"><div class="dm-auth-sent"><span class="dm-auth-emoji">📬</span><h2 class="dm-auth-h1">Письмо <em>отправлено!</em></h2><p class="dm-auth-sub">Мы отправили инструкцию на<br><strong>'.esc_html($sent_to).'</strong><br><br>Проверьте «Входящие» или «Спам».</p><a href="'.esc_url(home_url('/'.$s['slug_login'].'/')).'" class="dm-auth-btn">Вернуться ко входу <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a></div></div>';
        } else {
            $content = '<div class="dm-auth-card"><div class="dm-auth-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h1>Забыли <em>пароль?</em></h1><p class="dm-auth-sub">Введите ваш email — мы пришлём ссылку для сброса пароля.</p>'.$msg.'<form method="post">'.wp_nonce_field('dm_lost', 'dm_lost_nonce', true, false).'<div class="dm-auth-field"><label>Email адрес</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="text" name="user_login" placeholder="your@email.com" required></div></div><button type="submit" class="dm-auth-btn">Отправить ссылку <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form></div><a href="'.esc_url(home_url('/'.$s['slug_login'].'/')).'" class="dm-auth-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Назад ко входу</a>';
        }
        return $this->themed_auth_shell($content);
    }

    public function shortcode_resetpass() {
        $s = self::get_settings();
        $msg = '';
        $key = sanitize_text_field($_REQUEST['key'] ?? '');
        $login = sanitize_text_field($_REQUEST['login'] ?? '');
        $user = ($key && $login) ? check_password_reset_key($key, $login) : new WP_Error('missing', 'Ссылка для сброса пароля недействительна.');
        if (is_wp_error($user)) {
            $html = $this->alert('Ссылка для сброса пароля недействительна или устарела. Запросите новую ссылку.')
                .'<div style="margin-top:10px;text-align:center;"><a href="'.esc_url(home_url('/'.$s['slug_lostpassword'].'/')).'" style="font-weight:600;">Запросить новую ссылку</a></div>';
            return $this->auth_card('Сброс пароля', 'DavronMarket', $html);
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['dm_reset_nonce']) && wp_verify_nonce($_POST['dm_reset_nonce'], 'dm_reset')) {
            $pass1 = $_POST['pass1'] ?? '';
            $pass2 = $_POST['pass2'] ?? '';
            if (!$pass1 || !$pass2) $msg .= $this->alert('Заполните оба поля.');
            elseif ($pass1 !== $pass2) $msg .= $this->alert('Пароли не совпадают.');
            else {
                reset_password($user, $pass1);
                wp_safe_redirect(home_url('/'.$s['slug_login'].'/?reset=1')); exit;
            }
        }
        $content = '<div class="dm-auth-card"><div class="dm-auth-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg></div><h1>Новый <em>пароль</em></h1><p class="dm-auth-sub">Придумайте надёжный пароль для аккаунта DavronMarket</p>'.$msg.'<form method="post">'.wp_nonce_field('dm_reset', 'dm_reset_nonce', true, false).'<input type="hidden" name="key" value="'.esc_attr($key).'"><input type="hidden" name="login" value="'.esc_attr($login).'"><div class="dm-auth-field"><label>Новый пароль</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input type="password" id="dm-rp1" name="pass1" placeholder="Придумайте пароль" required autocomplete="new-password" oninput="dmResetChange()"><button type="button" class="dm-auth-eye" onclick="var i=document.getElementById(\'dm-rp1\');i.type=i.type===\'text\'?\'password\':\'text\';this.style.color=i.type===\'text\'?\'var(--gold)\':\''"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="dm-auth-sbar"><div class="dm-auth-sfill" id="dm-reset-fill"></div></div></div><div class="dm-auth-reqs"><div class="dm-auth-req" id="dm-r1"><span class="dm-auth-rdot"></span>Минимум 6 символов</div><div class="dm-auth-req" id="dm-r2"><span class="dm-auth-rdot"></span>Цифра или заглавная буква</div><div class="dm-auth-req" id="dm-r3"><span class="dm-auth-rdot"></span>Спецсимвол рекомендуется</div></div><div class="dm-auth-field"><label>Повторите пароль</label><div class="dm-auth-iw"><svg class="dm-auth-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input type="password" id="dm-rp2" name="pass2" placeholder="Повторите пароль" required autocomplete="new-password" oninput="dmResetChange()"><button type="button" class="dm-auth-eye" onclick="var i=document.getElementById(\'dm-rp2\');i.type=i.type===\'text\'?\'password\':\'text\';this.style.color=i.type===\'text\'?\'var(--gold)\':\''"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="dm-auth-match" id="dm-reset-match"></div></div><button type="submit" class="dm-auth-btn" id="dm-reset-btn" disabled>Сохранить пароль <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button></form></div><script>function dmResetChange(){var p1=document.getElementById("dm-rp1").value,p2=document.getElementById("dm-rp2").value;var r1=p1.length>=6,r2=/[A-Z0-9]/.test(p1),r3=/[^A-Za-z0-9]/.test(p1);document.getElementById("dm-r1").className="dm-auth-req"+(r1?" ok":"");document.getElementById("dm-r2").className="dm-auth-req"+(r2?" ok":"");document.getElementById("dm-r3").className="dm-auth-req"+(r3?" ok":"");var s=[r1,r2,r3].filter(Boolean).length;var cs=["","#ff4757","#f59e0b","#4ade80"][s]||"";document.getElementById("dm-reset-fill").style.cssText="width:"+(s*33.3)+"%;background:"+cs;var mt=document.getElementById("dm-reset-match");if(!p2){mt.textContent="";mt.className="dm-auth-match";}else if(p1===p2&&r1){mt.textContent="Пароли совпадают";mt.className="dm-auth-match ok";}else if(p1!==p2){mt.textContent="Не совпадают";mt.className="dm-auth-match no";}else{mt.textContent="Минимум 6 символов";mt.className="dm-auth-match no";}document.getElementById("dm-reset-btn").disabled=!(p1===p2&&r1);}</script>';
        return $this->themed_auth_shell($content);
    }

    public function shortcode_dashboard() {
        $s = self::get_settings();
        if (!is_user_logged_in()) { wp_safe_redirect(home_url('/'.$s['slug_login'].'/')); exit; }
        $user = wp_get_current_user();
        $display_name = $user->display_name ?: $user->user_login;
        $initial = function_exists('mb_substr') ? mb_strtoupper(mb_substr($display_name, 0, 1)) : strtoupper(substr($display_name, 0, 1));
        $logout_url = esc_url(home_url('/'.$s['slug_logout'].'/'));
        $profile_url = esc_url(home_url('/profile/'));
        $home_url = esc_url(home_url('/'));
        $display_name_esc = esc_html($display_name);
        $email_esc = esc_html($user->user_email);
        $content = <<<HTML
<style>
.dm-dash-ui{--bg:#050507;--gold:#f5c842;--gold2:#ffe066;--orange:#ff6b2b;--green:#4ade80;--red:#ff4757;--blue:#2b9cff;--purple:#a855f7;--white:#fff;--muted:rgba(255,255,255,.4);--border:rgba(255,255,255,.07);--g1:linear-gradient(135deg,#f5c842,#ff6b2b);--r:14px;position:relative;min-height:100vh;margin:calc(50% - 50vw);width:100vw;background:var(--bg);color:var(--white);font-family:'Syne',sans-serif;cursor:none;overflow:hidden}.dm-dash-ui *,.dm-dash-ui *::before,.dm-dash-ui *::after{box-sizing:border-box}.dm-dash-ui .grid{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 10%,transparent 100%)}.dm-dash-ui #cur{width:12px;height:12px;border-radius:50%;background:var(--gold);position:fixed;top:0;left:0;z-index:9999;pointer-events:none;transform:translate(-50%,-50%);mix-blend-mode:difference;transition:width .2s,height .2s}.dm-dash-ui #cur2{width:36px;height:36px;border-radius:50%;border:1px solid rgba(245,200,66,.4);position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transform:translate(-50%,-50%)}.dm-dash-topbar{position:sticky;top:0;z-index:100;height:64px;padding:0 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(5,5,7,.92);border-bottom:1px solid var(--border);backdrop-filter:blur(20px)}.dm-dash-logo{display:flex;align-items:center;gap:10px;text-decoration:none}.dm-dash-logo-ic{width:38px;height:38px;border-radius:10px;background:var(--g1);display:flex;align-items:center;justify-content:center}.dm-dash-logo-ic svg{width:18px;height:18px;fill:#000}.dm-dash-logo-n{font-family:'Unbounded',sans-serif;font-size:14px;font-weight:900;background:var(--g1);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.04em}.dm-dash-tbr{display:flex;align-items:center;gap:8px}.dm-dash-avbtn{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:6px 12px}.dm-dash-av{width:30px;height:30px;border-radius:50%;background:var(--g1);display:flex;align-items:center;justify-content:center;font-family:'Unbounded',sans-serif;font-size:11px;font-weight:900;color:#000}.dm-dash-av-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.8)}.dm-dash-main{max-width:1000px;margin:0 auto;padding:36px 24px;position:relative;z-index:1}.dm-dash-hero{border-radius:20px;padding:36px 40px;margin-bottom:24px;background:linear-gradient(135deg,#0d0a00,#1a1000 50%,#0d0a00);border:1px solid rgba(245,200,66,.15);position:relative;overflow:hidden}.dm-dash-hero::before{content:'';position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(245,200,66,.12),transparent 70%)}.dm-dash-hero::after{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--g1)}.dm-dash-hg{font-size:12px;font-weight:700;color:rgba(245,200,66,.6);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}.dm-dash-hn{font-family:'Unbounded',sans-serif;font-size:clamp(20px,3vw,28px);font-weight:900;letter-spacing:-.5px;margin-bottom:6px}.dm-dash-hn em{font-style:normal;background:var(--g1);-webkit-background-clip:text;background-clip:text;color:transparent}.dm-dash-he{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:16px}.dm-dash-chips{display:flex;flex-wrap:wrap;gap:8px}.dm-dash-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.dm-dash-cg{background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.25);color:var(--gold2)}.dm-dash-cv{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);color:#86efac}.dm-dash-cdot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:dmblink 2s infinite}.dm-dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}.dm-dash-stat{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);padding:20px;transition:.25s}.dm-dash-stat:hover{border-color:rgba(245,200,66,.2);transform:translateY(-2px)}.dm-dash-si{font-size:22px;margin-bottom:10px}.dm-dash-sn{font-family:'Unbounded',sans-serif;font-size:24px;font-weight:900;background:var(--g1);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1;margin-bottom:3px}.dm-dash-sl{font-size:11px;color:var(--muted);font-weight:600}.dm-dash-g2{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px}.dm-dash-kicker{font-size:10px;font-weight:700;color:rgba(255,255,255,.2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}.dm-dash-mgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dm-dash-mc{display:flex;align-items:center;gap:14px;padding:16px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);text-decoration:none;transition:.25s;position:relative;overflow:hidden;color:#fff}.dm-dash-mc:hover{border-color:rgba(245,200,66,.2);transform:translateX(3px)}.dm-dash-mci{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}.dm-dash-m1{background:rgba(245,200,66,.1)}.dm-dash-m2{background:rgba(43,156,255,.1)}.dm-dash-m3{background:rgba(74,222,128,.1)}.dm-dash-m4{background:rgba(255,71,87,.1)}.dm-dash-mct h3{font-family:'Unbounded',sans-serif;font-size:12px;font-weight:800;margin-bottom:2px;color:var(--white)}.dm-dash-mct p{font-size:11px;color:var(--muted)}.dm-dash-mca{margin-left:auto;color:rgba(255,255,255,.2);font-size:13px}.dm-dash-side{display:flex;flex-direction:column;gap:12px}.dm-dash-sc{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);padding:20px}.dm-dash-sc h4{font-family:'Unbounded',sans-serif;font-size:10px;font-weight:700;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}.dm-dash-acts{display:flex;flex-direction:column;gap:10px}.dm-dash-act{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--muted)}.dm-dash-adot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0}.dm-dash-adot.g{background:var(--gold);box-shadow:0 0 6px var(--gold)}.dm-dash-adot.gr{background:var(--green)}.dm-dash-tglink{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(245,200,66,.07);border:1px solid rgba(245,200,66,.2);border-radius:10px;text-decoration:none;font-size:11px;font-weight:700;color:var(--gold2)}.dm-dash-sdesc{font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:12px}.dm-dash-logbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:rgba(255,71,87,.07);border:1px solid rgba(255,71,87,.2);border-radius:var(--r);color:#ff7b86;font-family:'Unbounded',sans-serif;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;transition:.25s}.dm-dash-logbtn:hover{background:rgba(255,71,87,.12);border-color:rgba(255,71,87,.35);transform:translateY(-2px)}@media(max-width:768px){.dm-dash-stats{grid-template-columns:1fr 1fr}.dm-dash-g2{grid-template-columns:1fr}.dm-dash-topbar{padding:0 16px}.dm-dash-logo-n{display:none}.dm-dash-main{padding:20px 14px}.dm-dash-hero{padding:24px 20px}}@media(max-width:480px){.dm-dash-mgrid{grid-template-columns:1fr}}</style>
<div class="dm-dash-ui"><div class="grid"></div><div id="cur"></div><div id="cur2"></div><header class="dm-dash-topbar"><a href="{$home_url}" class="dm-dash-logo"><div class="dm-dash-logo-ic"><svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg></div><span class="dm-dash-logo-n">DavronMarket</span></a><div class="dm-dash-tbr"><div class="dm-dash-avbtn"><div class="dm-dash-av">{$initial}</div><span class="dm-dash-av-name">{$display_name_esc}</span></div></div></header><main class="dm-dash-main"><div class="dm-dash-hero"><p class="dm-dash-hg">Добро пожаловать</p><h1 class="dm-dash-hn"><em>{$display_name_esc}</em></h1><p class="dm-dash-he">{$email_esc}</p><div class="dm-dash-chips"><div class="dm-dash-chip dm-dash-cg"><span class="dm-dash-cdot"></span>Аккаунт активен</div><div class="dm-dash-chip dm-dash-cv">Верифицирован</div></div></div><div class="dm-dash-stats"><div class="dm-dash-stat"><div class="dm-dash-si">🛍️</div><div class="dm-dash-sn">0</div><div class="dm-dash-sl">Заказов</div></div><div class="dm-dash-stat"><div class="dm-dash-si">⭐</div><div class="dm-dash-sn">0</div><div class="dm-dash-sl">Бонусов</div></div><div class="dm-dash-stat"><div class="dm-dash-si">❤️</div><div class="dm-dash-sn">0</div><div class="dm-dash-sl">Избранное</div></div><div class="dm-dash-stat"><div class="dm-dash-si">🎁</div><div class="dm-dash-sn">0</div><div class="dm-dash-sl">Промокоды</div></div></div><div class="dm-dash-g2"><div><div class="dm-dash-kicker">Навигация</div><div class="dm-dash-mgrid"><a href="/orders/" class="dm-dash-mc"><div class="dm-dash-mci dm-dash-m1">🛍️</div><div class="dm-dash-mct"><h3>Заказы</h3><p>История покупок</p></div><span class="dm-dash-mca">↗</span></a><a href="{$profile_url}" class="dm-dash-mc"><div class="dm-dash-mci dm-dash-m2">👤</div><div class="dm-dash-mct"><h3>Профиль</h3><p>Личные данные</p></div><span class="dm-dash-mca">↗</span></a><a href="/wishlist/" class="dm-dash-mc"><div class="dm-dash-mci dm-dash-m3">❤️</div><div class="dm-dash-mct"><h3>Избранное</h3><p>Сохранённые</p></div><span class="dm-dash-mca">↗</span></a><a href="/settings/" class="dm-dash-mc"><div class="dm-dash-mci dm-dash-m4">⚙️</div><div class="dm-dash-mct"><h3>Настройки</h3><p>Безопасность</p></div><span class="dm-dash-mca">↗</span></a></div></div><div class="dm-dash-side"><div class="dm-dash-sc"><h4>Активность</h4><div class="dm-dash-acts"><div class="dm-dash-act"><span class="dm-dash-adot g"></span>Вход в систему</div><div class="dm-dash-act"><span class="dm-dash-adot gr"></span>Аккаунт создан</div><div class="dm-dash-act"><span class="dm-dash-adot"></span>Нет новых событий</div></div></div><div class="dm-dash-sc"><h4>Поддержка</h4><p class="dm-dash-sdesc">Есть вопросы? Напишите нам напрямую.</p><a href="https://t.me/davronmarket" target="_blank" rel="noopener" class="dm-dash-tglink">Написать в Telegram</a></div></div></div><div><a href="{$logout_url}" class="dm-dash-logbtn">Выйти из аккаунта</a></div></main></div><script>(function(){var root=document.currentScript.previousElementSibling;var c=root.querySelector('#cur'),c2=root.querySelector('#cur2');var mx=0,my=0,cx=0,cy=0;root.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;c.style.left=mx+'px';c.style.top=my+'px';});(function l(){cx+=(mx-cx)*.15;cy+=(my-cy)*.15;c2.style.left=cx+'px';c2.style.top=cy+'px';requestAnimationFrame(l);}());root.querySelectorAll('a,button,.dm-dash-stat,.dm-dash-mc').forEach(function(el){el.addEventListener('mouseenter',function(){c.style.width='20px';c.style.height='20px';c2.style.width='52px';c2.style.height='52px';});el.addEventListener('mouseleave',function(){c.style.width='12px';c.style.height='12px';c2.style.width='36px';c2.style.height='36px';});});}());</script>
HTML;
        return $content;
    }

    public function shortcode_logout() {
        $s = self::get_settings();
        if (is_user_logged_in()) {
            wp_logout();
        }
        $login_url = esc_url(home_url('/'.$s['slug_login'].'/'));
        $home_url = esc_url(home_url('/'));
        $content = '<style>@keyframes dmlogout{from{width:0}to{width:100%}}</style><div class="dm-auth-card" style="text-align:center;"><span class="dm-auth-emoji">👋</span><h1>До <em>свидания!</em></h1><p class="dm-auth-sub">Вы успешно вышли из аккаунта.<br>Перенаправляем на страницу входа…</p><div class="dm-auth-sbar" style="margin-bottom:26px;"><div class="dm-auth-sfill" style="width:100%;background:var(--g1);animation:dmlogout 3s linear forwards"></div></div><a href="'.$login_url.'" class="dm-auth-btn">Войти снова <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a><div class="dm-auth-links" style="justify-content:center;margin-top:14px;"><a href="'.$home_url.'">На главную</a></div></div><script>setTimeout(function(){window.location.href="'.$login_url.'";},3000);</script>';
        return $this->themed_auth_shell($content, '420px');
    }
}

new DavronMarket_SMTP_Lite_V200();
