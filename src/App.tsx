import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Calendar, AlertTriangle, Search, Bell, Navigation, Camera, Star, Trophy,
  ChevronRight, Truck, Recycle, Upload, Clock, CheckCircle2, Leaf, User,
  Phone, ArrowLeft, Home, MessageSquare, X, Plus, Mail, LogOut, BookOpen, Key,
  CheckCheck, Filter, SlidersHorizontal, ArrowUp, ArrowRight, CornerUpLeft, CornerUpRight,
  Flag, CalendarDays, Shield, Pencil, Pin, PinOff, LayoutDashboard, FileText, Gift, Globe,
} from "lucide-react";
import LoginFlow from "./LoginFlow";
import AdminPanel from "./AdminPanel";
import {
  recycleLocations, SimpleQR, fillColor, matchesFilter, getCompassDir, calcETA, todayLabel,
  initialSchedules, initialLiveUpdates, initialReports, leaderboard, initialRewards,
  urgencyColors, statusColors, initialNotices, schedSortKey, PRESET_ACCOUNTS,
  getDeviceAccounts, saveDeviceAccount, removeDeviceAccount,
} from "./appData";
import type { Bin, Report, LiveUpdate, Schedule, Reward, Notice, NavStep, UserAccount } from "./appData";
import {
  subscribeToReports, addReportToDb, updateReportStatusInDb,
  subscribeToSchedules, subscribeToNotices, syncUserProfileToDb,
  addRecycleSessionToDb, addRedemptionToDb, auth, googleProvider,
} from "./firebase";
import { signOut, signInWithPopup } from "firebase/auth";
import { GoogleMapView } from "./GoogleMapView";
import { SimeDarbyAddressPicker } from "./SimeDarbyAddressPicker";
import {
  SIME_DARBY_TOWNSHIPS,
  SIME_DARBY_COLLECTION_POINTS,
  getGoogleMapsNavigationUrl,
} from "./simeDarbyData";

const TABS = ["Home", "Map", "Activity", "Rewards", "Guide"] as const;
type Tab = (typeof TABS)[number];

const translations = {
  en: {
    nav_home:"Home", nav_map:"Map", nav_activity:"Activity", nav_rewards:"Rewards", nav_guide:"Guide",
    header_welcome:"Welcome to BinGo", header_realtime:"Live Tracking",
    notif_title:"Notifications", notif_mark_read:"Mark all read",
    btn_cancel:"Cancel", btn_confirm:"Confirm", btn_done:"Done", btn_back:"Back",
    btn_next:"Next", btn_submit:"Submit", btn_save:"Save Changes", btn_edit:"Edit",
    btn_close:"Close", btn_verify:"Verify & Confirm", btn_otp_cancel:"Cancel",
    status_pending:"Pending", status_in_action:"In Action", status_completed:"Completed", status_rejected:"Rejected",
    home_live:"Live Collection Fleet", home_depot:"Depot", home_your_area:"Your Area",
    home_eta:"ETA", home_next_collection:"Next Scheduled Collection", home_set_reminder:"Set Reminder",
    home_schedule:"Collection Schedule", home_nearest_first:"Nearest first",
    home_badge_next:"Next", home_badge_soon:"Upcoming",
    reminder_title:"Set Collection Reminder", reminder_subtitle:"Notify me before the next pickup",
    reminder_5m:"5 minutes before", reminder_30m:"30 minutes before",
    reminder_1h:"1 hour before", reminder_3h:"3 hours before",
    reminder_1d:"1 day before", reminder_2d:"2 days before",
    reminder_remove:"Remove Reminder",
    map_selangor:"Selangor · Drag to pan", map_full:"Full Screen Map", map_exit:"Exit Map",
    map_type:"Type:", map_status:"Status:", map_tap_pin:"locations · tap pin to navigate",
    map_found:"found", map_navigate:"Navigate", map_all:"All",
    map_recycling:"Recycling", map_general:"General", map_ewaste:"E-Waste",
    map_open:"Open", map_closed:"Closed",
    nav_you:"You", nav_away:"away", nav_full:"full",
    nav_choose:"Choose Transport Mode", nav_walking:"Walking", nav_driving:"Driving",
    nav_start:"Start Navigation", nav_next_step:"Next Step", nav_arriving:"Arriving Soon",
    nav_arrived:"You have arrived!", nav_walked:"walked", nav_driven:"driven",
    nav_capacity:"capacity", nav_ahead:"ahead", nav_then:"Then:",
    act_reports:"Reports", act_bookings:"Bookings", act_history:"History",
    act_pts_pending:"pts pending", act_view_details:"View Details",
    act_no_reports:"No reports match this filter.",
    act_upcoming:"Upcoming Collections", act_scheduled:"Scheduled",
    act_reminder_tip_title:"Set collection reminders",
    act_reminder_tip_body:"Go to Home to set reminders for upcoming bin collections so you never miss one.",
    act_history_title:"Request Status History",
    act_no_activity:"No activity yet.", act_no_records:"No records match this filter.",
    act_clear_filters:"Clear filters",
    act_time_all:"All Time", act_time_1m:"1 Month", act_time_3m:"3 Months",
    act_time_6m:"6 Months", act_time_1y:"1 Year", act_time_older:"> 1 Year",
    rew_total_pts:"Total Green Points", rew_collected:"Pickups",
    rew_recycled_kg:"Recycled (kg)", rew_redeem_title:"Redeem Rewards",
    rew_available:"rewards available", rew_total:"total",
    rew_my_rewards:"My Vouchers", rew_sold_out:"Out of stock",
    rew_redeem:"Redeem", rew_locked:"Locked",
    rew_pts_history:"Points Ledger", rew_eligibility:"Reward Eligibility",
    rew_pts_available:"pts available", rew_all_unlocked:"All rewards unlocked!",
    rew_eligible:"Eligible", rew_away:"more needed", rew_next:"Next reward:",
    rew_how_verified:"How Points Are Verified", rew_tap_expand:"tap to expand",
    rew_verified_credited:"Verified & Credited", rew_pending_verif:"Pending Verification",
    rew_pts_pending:"pending", rew_no_pts:"No verified points yet.",
    rew_pending_count:"pending verification",
    guide_title:"Residential Waste Guide", guide_subtitle:"Household sorting & recycling standard",
    guide_bin_sep:"Bin Separation Categories",
    guide_green:"Green Bin", guide_green_sub:"Organic & Food Waste",
    guide_blue:"Blue Bin", guide_blue_sub:"Dry Recyclables",
    guide_black:"Black / Grey Bin", guide_black_sub:"General Residual Waste",
    guide_ewaste:"E-Waste Station", guide_ewaste_sub:"Electronics & Hazardous Batteries",
    guide_tips:"Sorting Best Practices", guide_3r:"The 3R Principle",
    guide_reduce:"Reduce", guide_reduce_desc:"Cut consumption at source",
    guide_reuse:"Reuse", guide_reuse_desc:"Repurpose and repair items",
    guide_recycle:"Recycle", guide_recycle_desc:"Segregate cleanly into bins",
    guide_green_tip:"Composted organics can enrich community gardens!",
    guide_blue_tip:"Rinse containers and dry before placing in the blue bin.",
    guide_black_tip:"Minimise residual waste by replacing single-use items.",
    guide_ewaste_tip:"Never mix batteries or devices into standard trash.",
    guide_tip1:"Rinse dirty food containers to avoid contaminating clean paper materials.",
    guide_tip2:"Flatten cardboard boxes to maximise communal bin capacity.",
    guide_tip3:"Remove plastic films from cardboard packaging when possible.",
    guide_tip4:"Keep reusable shopping totes ready to eliminate single-use plastic bags.",
    guide_tip5:"Recycling one aluminium can saves enough power to run a TV for 3 hours.",
    guide_tip6:"Donate functioning electronics before considering e-waste disposal.",
    rec_title:"Log Recycled Items", rec_step:"Step", rec_of3:"of 3",
    rec_select_mat:"Select Material Type", rec_pts_per_kg:"pts/kg",
    rec_weight:"Estimated Weight (kg)", rec_weight_ph:"e.g. 2.5",
    rec_will_earn:"You will earn approximately", rec_green_pts:"Green Points",
    rec_scan:"Scan Station QR Code",
    rec_photo_ready:"Verification photo captured",
    rec_take_photo:"Snap photo of station scale or slip",
    rec_or_sim:"Or test verification:", rec_sim_qr:"Simulate QR Verification",
    rec_done_title:"Points Credited!", rec_great_job:"Recorded recycling of",
    rec_of:"of", rec_keep_up:"Thank you for keeping Selangor clean!",
    rep_title:"Report an Issue", rep_step:"Step", rep_of3:"of 3",
    rep_issue_type:"Issue Classification", rep_desc:"Description",
    rep_desc_ph:"Describe the incident (e.g. location details, smell, overflow)...",
    rep_gps:"GPS Location Verification", rep_gps_captured:"Coordinates pinned: Taman Jaya, PJ",
    rep_gps_tap:"Tap to pin your GPS location",
    rep_gps_err:"GPS location is required so our response crew can pinpoint the incident.",
    rep_photo:"Evidence Photos", rep_at_least1:"— at least 1 photo required",
    rep_attached:"attached", rep_add_photos:"Attach photos (required)",
    rep_add_more:"Add more", rep_left:"remaining",
    rep_location:"Incident Location", rep_photos:"Attached Photos",
    rep_not_selected:"Not selected", rep_not_set:"Not set", rep_none:"None",
    rep_urgency:"Urgency Level", rep_urgency_auto:"Urgency (system assessed)",
    rep_pts_msg:"Green Points will be credited once verified by municipal responders.",
    rep_new:"New Report",
    rep_issue_overflow:"Overflowing Bin", rep_issue_illegal:"Illegal Dumping",
    rep_issue_missed:"Missed Collection", rep_issue_damaged:"Damaged Bin",
    rep_issue_other:"Other Hazard",
    gps_title:"GPS Location Required",
    gps_body:"Please pin your GPS location so cleanup crews can find the exact site.",
    gps_capture:"Pin GPS Location", gps_dismiss:"Dismiss",
    det_desc:"Description", det_location:"Location",
    det_photo:"Attached Evidence", det_photo_attached:"Photo verified",
    det_no_photo:"No photos uploaded", det_timeline:"Resolution Timeline",
    det_pts:"Reward Points", det_pts_awarded:"Green Points Awarded",
    det_pts_rejected:"No points — report rejected.",
    det_pts_pending:"pts pending municipal verification.",
    det_admin_comments:"Municipal Responder Notes", det_no_comments:"No responder comments yet.",
    plus_title:"Dispose or Recycle Item", plus_submitted:"Submitted!",
    plus_choose_desc:"Choose your preferred item evaluation path",
    plus_ai_title:"AI Camera Assistant",
    plus_ai_desc:"Snap or upload a photo — AI classifies the material and gives instant disposal instructions",
    plus_manual_title:"Manual Material Guide",
    plus_manual_desc:"Select material directly from our municipal classification rules",
    plus_step:"Step", plus_of:"of",
    plus_ai_s1:"Photo Capture", plus_ai_s2:"Visual Analysis",
    plus_ai_s3:"Review Details", plus_ai_s4:"Disposal Instructions",
    plus_ai_s5:"Management Review", plus_ai_s6:"Next Action",
    plus_man_s1:"Item Details", plus_man_s2:"Confirm Classification",
    plus_man_s3:"Disposal Path", plus_man_s4:"Management Review", plus_man_s5:"Next Action",
    plus_photo_ready:"Photo ready for analysis", plus_tap_change:"Tap to retake photo",
    plus_take_upload:"Take or Upload Item Photo",
    plus_ai_will:"AI will inspect the item and identify the appropriate waste category",
    plus_simulate:"Simulate Camera Snap", plus_desc_opt:"Notes (optional)",
    plus_desc_ph:"e.g. Broken monitor, old lithium battery...",
    plus_analyse:"Inspect with AI →", plus_analysing:"Analyzing item image...",
    plus_ai_id:"Analyzing geometry and surface material",
    plus_ai_sug:"AI Identification Result", plus_confidence:"% match confidence",
    plus_detected:"Detected Item", plus_category:"Waste Category", plus_suggested:"Recommended Route",
    plus_low_conf:"Confidence below 80% — please verify in the next step.",
    plus_ai_advises:"AI provides guidance. You make the final decision.",
    plus_review_btn:"Proceed to Confirmation →",
    plus_prefilled:"Values detected by camera. Tap to adjust if needed.",
    plus_tap_select:"Tap to select", plus_item_type:"Item Sub-type", plus_condition:"Item Condition",
    plus_change:"Change", plus_select:"Select",
    plus_cond_good:"Reusable", plus_cond_fair:"Minor Wear", plus_cond_poor:"Degraded", plus_cond_broken:"Broken / Non-functional",
    plus_qty:"Estimated Quantity / Weight", plus_qty_opt:"(optional)", plus_qty_ph:"e.g. 2 pieces or 3 kg",
    plus_continue:"Continue →",
    plus_confirm_msg:"Please verify the summary above before proceeding.",
    plus_confirm_btn:"Confirm & View Instructions →",
    plus_ai_rec:"AI-recommended route based on material analysis.",
    plus_rules_rec:"Standard council route for this category.",
    plus_recommended:"Recommended", plus_alternative:"Alternative",
    plus_best_for:"Best suited for", plus_alt_option:"Secondary option",
    plus_mgmt_title:"Building Management Consultation",
    plus_uncertain1:"This material requires specialized bulk handling or hazardous permits. Consultation with building management is advised.",
    plus_uncertain2:"If uncertain or if the item poses safety hazards, request your property management office to advise.",
    plus_ask_mgmt:"Ask Property Management",
    plus_ask_mgmt_desc:"Route details to building management staff",
    plus_proceed:"Proceed Independently",
    plus_proceed_desc:"Continue to drop-off station or schedule directly",
    plus_selected:"Selected:",
    plus_choose_action:"Select your next action:",
    plus_find_pt:"Find Collection Station", plus_find_pt_desc:"Open nearest drop-off on map",
    plus_directions:"Get Turn-by-Turn Route", plus_directions_desc:"Navigate directly to the facility",
    plus_book:"Book Bulk Pickup", plus_book_desc:"Schedule residential pickup appointment",
    plus_report:"Submit Incident Report", plus_report_desc:"Report an overflowing or damaged bin",
    plus_recycling:"Log Recycling", plus_recycling_desc:"Record drop-off and earn points",
    plus_done:"Close", plus_all_done:"Disposal Logged!",
    plus_mgmt_done:"Your request has been forwarded to property management. You will receive an update once reviewed.",
    plus_route_done:"Item designated for",
    plus_track:"Track requests in the Activity tab.",
    mr_title:"My Active Vouchers", mr_items_redeemed:"vouchers available", mr_item_redeemed:"voucher available",
    mr_no_title:"No Vouchers Yet",
    mr_no_desc:"Redeem green points for grocery or transit vouchers to see them here.",
    mr_show_qr:"Show Barcode", mr_exp:"Valid until:",
    qr_scan:"Scan barcode at partner checkout", qr_reward_id:"Voucher Code",
    qr_expires:"Expires on:", qr_close:"Dismiss",
    logout_title:"Sign Out?",
    logout_body:"Are you sure you want to sign out of your BinGo residential account?",
    logout_cancel:"Cancel", logout_confirm:"Sign Out",
    ach_title:"Civic Achievements", ach_badges:"12 of 15 badges unlocked",
    prof_account:"Account Information", prof_more:"Preferences & Support",
    prof_edit:"Profile Details", prof_edit_sub:"Update name or security credentials",
    prof_phone:"Mobile Number", prof_email:"Email Address",
    prof_addresses:"Registered Residence", prof_addresses_sub:"Zone A, Taman Jaya, PJ",
    prof_notifs:"Push Alerts", prof_notifs_sub:"Collection reminders and status alerts",
    prof_language:"App Language", prof_guidelines:"Waste Guidelines",
    prof_guidelines_sub:"Official municipal sorting standards",
    prof_feedback:"Submit Feedback", prof_feedback_sub:"Rate your experience with BinGo",
    prof_signout:"Sign Out", prof_signout_sub:"Log out of this device",
    prof_ep_name:"Display Name", prof_ep_name_ph:"Your full name",
    prof_ep_password:"Change Password",
    prof_ep_password_hint:"Leave blank to keep your existing password",
    prof_ep_otp_hint:"SMS OTP verification required for password updates",
    prof_ep_cur_pass:"Current password", prof_ep_new_pass:"New password",
    prof_ep_confirm_pass:"Confirm new password",
    prof_ep_saved_title:"Profile Updated", prof_ep_saved_body:"Your account changes have been saved.",
    prof_ep_err_name:"Name cannot be blank.",
    prof_ep_err_wrong_pass:"Current password does not match.",
    prof_ep_err_pass_rules:"Must be 8–12 characters with at least one symbol.",
    prof_ep_err_mismatch:"Passwords do not match.",
    otp_sent:"Verification Code Sent", otp_enter:"Enter 6-digit code",
    otp_demo:"Demo test code: 123456", otp_error:"Incorrect code. Please try again.",
    prof_phone_current:"Current Phone", prof_phone_new:"New Phone Number",
    prof_phone_ph:"+60 12-345 6789", prof_phone_send:"Send SMS & Update",
    prof_phone_done:"Phone number updated successfully!",
    prof_email_current:"Current Email", prof_email_new:"New Email Address",
    prof_email_ph:"your@email.com", prof_email_send:"Send Verification & Update",
    prof_email_done:"Email updated successfully!",
    prof_addr_coll_day:"Assigned Collection Days", prof_addr_nearest:"Nearest Drop Point",
    prof_addr_zone:"Zone", prof_addr_zone_ph:"e.g. Zone A",
    prof_addr_area:"Neighbourhood / Address", prof_addr_area_ph:"e.g. Taman Jaya, Petaling Jaya",
    prof_addr_coll_ph:"e.g. Monday & Friday", prof_addr_send:"Verify & Save Address",
    prof_addr_map:"Locate on Map", prof_addr_done:"Address updated successfully!",
    prof_notif1:"Collection Reminders", prof_notif1_sub:"Alert night before scheduled pickup",
    prof_notif2:"Incident Updates", prof_notif2_sub:"Real-time updates when reports change status",
    prof_notif3:"Green Points Credits", prof_notif3_sub:"Instant notification when points are awarded",
    prof_notif4:"Neighbourhood Alerts", prof_notif4_sub:"Traffic disruptions or weather advisories",
    prof_notif5:"Council Notices", prof_notif5_sub:"Important municipal announcements",
    prof_lang_select:"Select your preferred interface language.",
    prof_lang_en:"English", prof_lang_ms:"Malay", prof_lang_ms_native:"Bahasa Melayu",
    prof_fb_question:"How would you rate your municipal waste management service?",
    prof_fb_ph:"Write your comments or suggestions here...",
    prof_fb_submit:"Send Feedback",
    prof_fb_sent_title:"Feedback Submitted",
    prof_fb_sent_body:"Thank you for helping us maintain clean residential communities.",
    lang_title:"Change App Language?", lang_body_pre:"Switch language to",
    lang_body_suf:"? The interface will update immediately.",
    lang_loading:"Applying language...",
    pts_v_reports:"Incident Reports",
    pts_v_reports_desc:"Points awarded after municipal crew marks the incident Completed.",
    pts_v_recycling:"Material Drop-Off",
    pts_v_recycling_desc:"Credited upon station QR scan or weigh-in slip verification.",
    pts_v_donation:"Item Donation",
    pts_v_donation_desc:"Awarded after partner charity confirms receipt.",
    pts_v_other:"Community Eco Initiatives",
    pts_v_other_desc:"Awarded for community cleanups and recycling drives.",
    pts_v_redemption:"Voucher Redemption",
    pts_v_redemption_desc:"Points deduct immediately when a voucher code is issued.",
    pts_v_reports_long:"submitted as Pending. Points are only awarded once municipal staff marks the ticket as",
    pts_v_recycling_long:"points calculated by weight (1–10 pts/kg) and verified by station sensor QR codes.",
  },
  ms: {
    nav_home:"Utama", nav_map:"Peta", nav_activity:"Aktiviti", nav_rewards:"Ganjaran", nav_guide:"Panduan",
    header_welcome:"Selamat datang ke BinGo", header_realtime:"Penjejakan Langsung",
    notif_title:"Pemberitahuan", notif_mark_read:"Tanda semua dibaca",
    btn_cancel:"Batal", btn_confirm:"Sahkan", btn_done:"Selesai", btn_back:"Kembali",
    btn_next:"Seterusnya", btn_submit:"Hantar", btn_save:"Simpan Perubahan", btn_edit:"Sunting",
    btn_close:"Tutup", btn_verify:"Sahkan & Teruskan", btn_otp_cancel:"Batal",
    status_pending:"Menunggu", status_in_action:"Dalam Tindakan", status_completed:"Selesai", status_rejected:"Ditolak",
    home_live:"Lori Kutipan Langsung", home_depot:"Depot", home_your_area:"Kawasan Anda",
    home_eta:"Jangkaan Tiba", home_next_collection:"Kutipan Berjadual Seterusnya", home_set_reminder:"Tetapkan Peringatan",
    home_schedule:"Jadual Kutipan", home_nearest_first:"Terdekat dahulu",
    home_badge_next:"Seterusnya", home_badge_soon:"Akan Datang",
    reminder_title:"Tetapkan Peringatan Kutipan", reminder_subtitle:"Maklumkan sebelum waktu kutipan",
    reminder_5m:"5 minit sebelum", reminder_30m:"30 minit sebelum",
    reminder_1h:"1 jam sebelum", reminder_3h:"3 jam sebelum",
    reminder_1d:"1 hari sebelum", reminder_2d:"2 hari sebelum",
    reminder_remove:"Padam Peringatan",
    map_selangor:"Selangor · Seret untuk gerak", map_full:"Peta Penuh", map_exit:"Tutup Peta",
    map_type:"Jenis:", map_status:"Status:", map_tap_pin:"lokasi · tekan pin untuk navigasi",
    map_found:"ditemui", map_navigate:"Pandu Arah", map_all:"Semua",
    map_recycling:"Kitar Semula", map_general:"Sisa Am", map_ewaste:"E-Sisa",
    map_open:"Dibuka", map_closed:"Ditutup",
    nav_you:"Anda", nav_away:"jarak", nav_full:"penuh",
    nav_choose:"Pilih Cara Perjalanan", nav_walking:"Berjalan Kaki", nav_driving:"Memandu",
    nav_start:"Mula Pandu Arah", nav_next_step:"Langkah Seterusnya", nav_arriving:"Hampir Tiba",
    nav_arrived:"Anda telah sampai!", nav_walked:"berjalan", nav_driven:"memandu",
    nav_capacity:"kapasiti", nav_ahead:"di hadapan", nav_then:"Kemudian:",
    act_reports:"Laporan", act_bookings:"Tempahan", act_history:"Sejarah",
    act_pts_pending:"mata menunggu", act_view_details:"Lihat Butiran",
    act_no_reports:"Tiada laporan sepadan dengan tapisan ini.",
    act_upcoming:"Kutipan Akan Datang", act_scheduled:"Dijadualkan",
    act_reminder_tip_title:"Tetapkan peringatan kutipan",
    act_reminder_tip_body:"Buka tab Utama untuk tetapkan peringatan lori kutipan.",
    act_history_title:"Sejarah Status Permohonan",
    act_no_activity:"Tiada rekod lagi.", act_no_records:"Tiada rekod sepadan dengan tapisan.",
    act_clear_filters:"Set semula tapisan",
    act_time_all:"Semua Masa", act_time_1m:"1 Bulan", act_time_3m:"3 Bulan",
    act_time_6m:"6 Bulan", act_time_1y:"1 Tahun", act_time_older:"> 1 Tahun",
    rew_total_pts:"Jumlah Mata Hijau", rew_collected:"Kutipan",
    rew_recycled_kg:"Kitar Semula (kg)", rew_redeem_title:"Tebus Baucar",
    rew_available:"ganjaran boleh tebus", rew_total:"jumlah",
    rew_my_rewards:"Baucar Saya", rew_sold_out:"Kehabisan stok",
    rew_redeem:"Tebus", rew_locked:"Terkunci",
    rew_pts_history:"Buku Lejar Mata", rew_eligibility:"Kelayakan Ganjaran",
    rew_pts_available:"mata tersedia", rew_all_unlocked:"Semua ganjaran telah dibuka!",
    rew_eligible:"Layak", rew_away:"mata lagi diperlukan", rew_next:"Ganjaran seterusnya:",
    rew_how_verified:"Cara Pengesahan Mata", rew_tap_expand:"tekan untuk kembangkan",
    rew_verified_credited:"Disahkan & Dikredit", rew_pending_verif:"Menunggu Pengesahan",
    rew_pts_pending:"menunggu", rew_no_pts:"Tiada mata disahkan lagi.",
    rew_pending_count:"menunggu semakan",
    guide_title:"Panduan Sisa Kediaman", guide_subtitle:"Piawaian pengasingan sisa isi rumah",
    guide_bin_sep:"Kategori Tong Sampah",
    guide_green:"Tong Hijau", guide_green_sub:"Sisa Makanan & Organik",
    guide_blue:"Tong Biru", guide_blue_sub:"Bahan Kitar Semula Kering",
    guide_black:"Tong Hitam / Kelabu", guide_black_sub:"Sisa Baki Am",
    guide_ewaste:"Pusat E-Sisa", guide_ewaste_sub:"Elektronik & Bateri Toksik",
    guide_tips:"Amalan Terbaik Pengasingan", guide_3r:"Prinsip 3R",
    guide_reduce:"Kurangkan", guide_reduce_desc:"Jimat penggunaan dari punca",
    guide_reuse:"Guna Semula", guide_reuse_desc:"Guna dan baiki barangan lama",
    guide_recycle:"Kitar Semula", guide_recycle_desc:"Asingkan mengikut tong yang betul",
    guide_green_tip:"Sisa organik kompos boleh dijadikan baja komuniti!",
    guide_blue_tip:"Bilas dan keringkan bekas sebelum dimasukkan ke tong biru.",
    guide_black_tip:"Kurangkan sisa am dengan mengelakkan barangan pakai buang.",
    guide_ewaste_tip:"Jangan buang peranti atau bateri ke dalam tong sampah biasa.",
    guide_tip1:"Bilas sisa makanan pada bekas plastik bagi mengelakkan pencemaran kertas.",
    guide_tip2:"Lekapkan kotak kadbod untuk jimatkan ruang tong komuniti.",
    guide_tip3:"Tanggalkan pita pelekat atau plastik pada bungkusan kotak jika boleh.",
    guide_tip4:"Gunakan beg beli-belah guna semula untuk elak beg plastik.",
    guide_tip5:"Kitar semula satu tin aluminium menjimatkan kuasa TV selama 3 jam.",
    guide_tip6:"Dermakan barangan elektrik yang masih berfungsi sebelum dibuang.",
    rec_title:"Catat Kitar Semula", rec_step:"Langkah", rec_of3:"daripada 3",
    rec_select_mat:"Pilih Kategori Bahan", rec_pts_per_kg:"mata/kg",
    rec_weight:"Anggaran Berat (kg)", rec_weight_ph:"cth. 2.5",
    rec_will_earn:"Anda akan menerima anggaran", rec_green_pts:"Mata Hijau",
    rec_scan:"Imbas Kod QR Stesen",
    rec_photo_ready:"Foto pengesahan dirakam",
    rec_take_photo:"Ambil gambar resit atau skala timbang",
    rec_or_sim:"Atau uji simulasi:", rec_sim_qr:"Simulasi Imbasan QR",
    rec_done_title:"Mata Telah Dikreditkan!", rec_great_job:"Berjaya merekod kitar semula",
    rec_of:"untuk", rec_keep_up:"Terima kasih kerana memastikan Selangor bersih!",
    rep_title:"Laporkan Masalah", rep_step:"Langkah", rep_of3:"daripada 3",
    rep_issue_type:"Kategori Aduan", rep_desc:"Penerangan Masalah",
    rep_desc_ph:"Terangkan butiran (cth. lokasi tepat, bau, tong rosak)...",
    rep_gps:"Pengesahan Lokasi GPS", rep_gps_captured:"Lokasi dipin: Taman Jaya, PJ",
    rep_gps_tap:"Tekan untuk pin lokasi GPS anda",
    rep_gps_err:"Lokasi GPS diperlukan supaya pasukan tindakan dapat ke lokasi tepat.",
    rep_photo:"Foto Bukti", rep_at_least1:"— sekurang-kurangnya 1 foto diperlukan",
    rep_attached:"dilampirkan", rep_add_photos:"Lampirkan foto (diperlukan)",
    rep_add_more:"Tambah lagi", rep_left:"baki",
    rep_location:"Lokasi Kejadian", rep_photos:"Foto Bukti",
    rep_not_selected:"Belum dipilih", rep_not_set:"Belum ditetapkan", rep_none:"Tiada",
    rep_urgency:"Tahap Keutamaan", rep_urgency_auto:"Keutamaan (dinilai sistem)",
    rep_pts_msg:"Mata Hijau akan dikreditkan setelah disahkan oleh pihak berkuasa.",
    rep_new:"Laporan Baru",
    rep_issue_overflow:"Tong Melimpah", rep_issue_illegal:"Pembuangan Haram",
    rep_issue_missed:"Kutipan Terlepas", rep_issue_damaged:"Tong Rosak",
    rep_issue_other:"Bahaya Lain",
    gps_title:"Lokasi GPS Diperlukan",
    gps_body:"Sila pin lokasi GPS anda supaya krew pembersihan dapat mengesan lokasi.",
    gps_capture:"Pin Lokasi GPS", gps_dismiss:"Batal",
    det_desc:"Penerangan", det_location:"Lokasi",
    det_photo:"Bukti Bergambar", det_photo_attached:"Foto disahkan",
    det_no_photo:"Tiada foto dimuat naik", det_timeline:"Garis Masa Tindakan",
    det_pts:"Mata Ganjaran", det_pts_awarded:"Mata Hijau Diberikan",
    det_pts_rejected:"Tiada mata — aduan ditolak.",
    det_pts_pending:"mata menunggu pengesahan pegawai.",
    det_admin_comments:"Catatan Pasukan Tindakan", det_no_comments:"Tiada catatan lagi.",
    plus_title:"Buang atau Kitar Semula", plus_submitted:"Dihantar!",
    plus_choose_desc:"Pilih kaedah penilaian barangan anda",
    plus_ai_title:"Bantuan Kamera AI",
    plus_ai_desc:"Ambil atau muat naik foto — AI akan menganalisis bahan dan memberi arahan pelupusan",
    plus_manual_title:"Panduan Bahan Manual",
    plus_manual_desc:"Pilih bahan secara manual mengikut piawaian pengasingan majlis",
    plus_step:"Langkah", plus_of:"daripada",
    plus_ai_s1:"Rakam Foto", plus_ai_s2:"Analisis Visual",
    plus_ai_s3:"Semak Maklumat", plus_ai_s4:"Arahan Pelupusan",
    plus_ai_s5:"Semakan Pengurusan", plus_ai_s6:"Tindakan Lanjut",
    plus_man_s1:"Maklumat Barangan", plus_man_s2:"Pengesahan Bahan",
    plus_man_s3:"Laluan Pelupusan", plus_man_s4:"Semakan Pengurusan", plus_man_s5:"Tindakan Lanjut",
    plus_photo_ready:"Foto sedia untuk dianalisis", plus_tap_change:"Tekan untuk tukar gambar",
    plus_take_upload:"Ambil atau Muat Naik Foto Barangan",
    plus_ai_will:"AI akan memeriksa barangan dan mengenal pasti tong yang sesuai",
    plus_simulate:"Simulasi Ambil Gambar", plus_desc_opt:"Catatan Tambahan (pilihan)",
    plus_desc_ph:"cth. Skrin pecah, bateri lama...",
    plus_analyse:"Periksa dengan AI →", plus_analysing:"Menganalisis gambar barangan...",
    plus_ai_id:"Mengenal pasti geometri dan bahan permukaan",
    plus_ai_sug:"Hasil Pengecaman AI", plus_confidence:"% keyakinan padanan",
    plus_detected:"Barangan Dikesan", plus_category:"Kategori Sisa", plus_suggested:"Laluan Disyorkan",
    plus_low_conf:"Keyakinan di bawah 80% — sila semak pada langkah seterusnya.",
    plus_ai_advises:"AI memberi cadangan. Anda membuat keputusan akhir.",
    plus_review_btn:"Teruskan ke Pengesahan →",
    plus_prefilled:"Maklumat dikesan oleh kamera. Tekan untuk betulkan jika perlu.",
    plus_tap_select:"Tekan untuk pilih", plus_item_type:"Sub-jenis Barangan", plus_condition:"Keadaan Barangan",
    plus_change:"Tukar", plus_select:"Pilih",
    plus_cond_good:"Boleh Guna Semula", plus_cond_fair:"Sedikit Lusuh", plus_cond_poor:"Rosak Ringan", plus_cond_broken:"Rosak Sepenuhnya",
    plus_qty:"Anggaran Kuantiti / Berat", plus_qty_opt:"(pilihan)", plus_qty_ph:"cth. 2 biji atau 3 kg",
    plus_continue:"Teruskan →",
    plus_confirm_msg:"Sila sahkan maklumat di atas sebelum meneruskan.",
    plus_confirm_btn:"Sahkan & Lihat Arahan →",
    plus_ai_rec:"Laluan disyorkan AI berdasarkan analisis visual.",
    plus_rules_rec:"Laluan piawai majlis bagi kategori ini.",
    plus_recommended:"Disyorkan", plus_alternative:"Alternatif",
    plus_best_for:"Paling sesuai untuk", plus_alt_option:"Pilihan kedua",
    plus_mgmt_title:"Konsultasi Pengurusan Bangunan",
    plus_uncertain1:"Bahan ini memerlukan pengendalian pukal khas. Nasihat pengurusan bangunan disyorkan.",
    plus_uncertain2:"Jika tidak pasti atau bahan melibatkan bahaya keselamatan, rujuk pejabat pengurusan anda.",
    plus_ask_mgmt:"Rujuk Pengurusan Bangunan",
    plus_ask_mgmt_desc:"Hantar butiran kepada pengurusan hartanah",
    plus_proceed:"Teruskan Sendiri",
    plus_proceed_desc:"Teruskan ke pusat kitar semula atau tempah lori",
    plus_selected:"Dipilih:",
    plus_choose_action:"Pilih tindakan seterusnya:",
    plus_find_pt:"Cari Pusat Pengumpulan", plus_find_pt_desc:"Buka lokasi terdekat pada peta",
    plus_directions:"Navigasi Perjalanan", plus_directions_desc:"Pandu arah terus ke stesen",
    plus_book:"Tempah Lori Pukal", plus_book_desc:"Jadualkan kutipan sisa besar",
    plus_report:"Hantar Laporan Sisa", plus_report_desc:"Laporkan tong rosak atau melimpah",
    plus_recycling:"Catat Kitar Semula", plus_recycling_desc:"Rkod penurunan untuk dapat mata",
    plus_done:"Tutup", plus_all_done:"Pelupusan Direkod!",
    plus_mgmt_done:"Permohonan anda telah dimajukan kepada pihak pengurusan bangunan. Anda akan dimaklumkan.",
    plus_route_done:"Barangan ditetapkan untuk",
    plus_track:"Jejak status permohonan dalam tab Aktiviti.",
    mr_title:"Baucar Aktif Saya", mr_items_redeemed:"baucar tersedia", mr_item_redeemed:"baucar tersedia",
    mr_no_title:"Tiada Baucar Lagi",
    mr_no_desc:"Tebus mata hijau untuk baucar barangan dapur atau tambang transit.",
    mr_show_qr:"Tunjuk Kod Bar", mr_exp:"Sah sehingga:",
    qr_scan:"Imbas kod bar di kaunter rakan niaga", qr_reward_id:"Kod Baucar",
    qr_expires:"Tarikh Luput:", qr_close:"Tutup",
    logout_title:"Log Keluar?",
    logout_body:"Adakah anda pasti ingin log keluar daripada akaun BinGo anda?",
    logout_cancel:"Batal", logout_confirm:"Log Keluar",
    ach_title:"Pencapaian Komuniti", ach_badges:"12 daripada 15 lencana dibuka",
    prof_account:"Maklumat Akaun", prof_more:"Pilihan & Sokongan",
    prof_edit:"Butiran Profil", prof_edit_sub:"Kemaskini nama atau kata laluan",
    prof_phone:"Nombor Telefon", prof_email:"Alamat Emel",
    prof_addresses:"Kediaman Berdaftar", prof_addresses_sub:"Zon A, Taman Jaya, PJ",
    prof_notifs:"Pemberitahuan", prof_notifs_sub:"Peringatan jadual dan status laporan",
    prof_language:"Bahasa Aplikasi", prof_guidelines:"Panduan Sisa",
    prof_guidelines_sub:"Piawaian pengasingan rasmi majlis",
    prof_feedback:"Hantar Maklum Balas", prof_feedback_sub:"Nilai pengalaman anda menggunakan BinGo",
    prof_signout:"Log Keluar", prof_signout_sub:"Keluar dari peranti ini",
    prof_ep_name:"Nama Penuh", prof_ep_name_ph:"Nama anda",
    prof_ep_password:"Tukar Kata Laluan",
    prof_ep_password_hint:"Biarkan kosong jika tidak mahu menukar",
    prof_ep_otp_hint:"Kod SMS diperlukan untuk pengesahan kata laluan",
    prof_ep_cur_pass:"Kata laluan semasa", prof_ep_new_pass:"Kata laluan baru",
    prof_ep_confirm_pass:"Sahkan kata laluan baru",
    prof_ep_saved_title:"Profil Dikemaskini", prof_ep_saved_body:"Perubahan akaun anda telah disimpan.",
    prof_ep_err_name:"Nama tidak boleh kosong.",
    prof_ep_err_wrong_pass:"Kata laluan semasa tidak tepat.",
    prof_ep_err_pass_rules:"Mesti 8–12 aksara dan mengandungi sekurang-kurangnya satu simbol.",
    prof_ep_err_mismatch:"Kata laluan tidak sepadan.",
    otp_sent:"Kod Pengesahan Dihantar", otp_enter:"Masukkan kod 6 digit",
    otp_demo:"Kod ujian: 123456", otp_error:"Kod salah. Sila cuba lagi.",
    prof_phone_current:"Nombor Semasa", prof_phone_new:"Nombor Baru",
    prof_phone_ph:"+60 12-345 6789", prof_phone_send:"Hantar SMS & Kemaskini",
    prof_phone_done:"Nombor telefon berjaya dikemaskini!",
    prof_email_current:"Emel Semasa", prof_email_new:"Emel Baru",
    prof_email_ph:"nama@emel.com", prof_email_send:"Hantar Pengesahan & Kemaskini",
    prof_email_done:"Alamat emel berjaya dikemaskini!",
    prof_addr_coll_day:"Hari Kutipan Ditetapkan", prof_addr_nearest:"Pusat Kitar Semula Terdekat",
    prof_addr_zone:"Zon", prof_addr_zone_ph:"cth. Zon A",
    prof_addr_area:"Kawasan / Alamat", prof_addr_area_ph:"cth. Taman Jaya, Petaling Jaya",
    prof_addr_coll_ph:"cth. Isnin & Jumaat", prof_addr_send:"Sahkan & Simpan Alamat",
    prof_addr_map:"Lihat pada Peta", prof_addr_done:"Alamat berjaya dikemaskini!",
    prof_notif1:"Peringatan Kutipan", prof_notif1_sub:"Pemberitahuan malam sebelum lori tiba",
    prof_notif2:"Status Aduan", prof_notif2_sub:"Makluman segera apabila laporan diambil tindakan",
    prof_notif3:"Kredit Mata Hijau", prof_notif3_sub:"Pemberitahuan bila mata baru diterima",
    prof_notif4:"Makluman Komuniti", prof_notif4_sub:"Lencongan jalan atau cuaca buruk",
    prof_notif5:"Pengumuman Majlis", prof_notif5_sub:"Berita penting pengurusan perbandaran",
    prof_lang_select:"Pilih bahasa antara muka pilihan anda.",
    prof_lang_en:"Inggeris", prof_lang_ms:"Melayu", prof_lang_ms_native:"Bahasa Melayu",
    prof_fb_question:"Bagaimanakah penilaian anda terhadap perkhidmatan kutipan sisa majlis?",
    prof_fb_ph:"Tulis komen atau cadangan anda di sini...",
    prof_fb_submit:"Hantar Maklum Balas",
    prof_fb_sent_title:"Maklum Balas Diterima",
    prof_fb_sent_body:"Terima kasih kerana bersama-sama menjaga kebersihan kediaman Selangor.",
    lang_title:"Tukar Bahasa Aplikasi?", lang_body_pre:"Tukar paparan kepada",
    lang_body_suf:"? Bahasa akan berubah serta-merta.",
    lang_loading:"Menukar bahasa...",
    pts_v_reports:"Laporan Aduan Sisa",
    pts_v_reports_desc:"Mata diberikan selepas pegawai majlis menyelesaikan aduan.",
    pts_v_recycling:"Penghantaran Bahan Kitar Semula",
    pts_v_recycling_desc:"Dikreditkan melalui imbasan kod QR stesen pengumpulan.",
    pts_v_donation:"Derma Barangan",
    pts_v_donation_desc:"Diberikan setelah disahkan oleh organisasi kebajikan rakan kongsi.",
    pts_v_other:"Program Komuniti Hijau",
    pts_v_other_desc:"Ganjaran untuk program gotong-royong dan pembersihan taman.",
    pts_v_redemption:"Penebusan Baucar",
    pts_v_redemption_desc:"Mata ditolak secara automatik sebaik sahaja baucar dijana.",
    pts_v_reports_long:"dihantar sebagai Menunggu. Mata hanya dikreditkan apabila pegawai mengesahkan status",
    pts_v_recycling_long:"mata dikira mengikut berat (1–10 mata/kg) dan disahkan melalui sensor stesen.",
  },
} as const;
type TKey = keyof typeof translations.en;

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [reports, setReports] = useState(initialReports);
  const [liveUpdates, setLiveUpdates] = useState(initialLiveUpdates);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [rewards, setRewards] = useState(initialRewards);
  const [bins, setBins] = useState(recycleLocations.map(l => ({ ...l })));
  const [notices, setNotices] = useState<Notice[]>(initialNotices);

  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [showProfile, setShowProfile] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [plusStep, setPlusStep] = useState(0);
  const [plusMode, setPlusMode] = useState<"ai" | "manual" | "">("");
  const [plusPhoto, setPlusPhoto] = useState(false);
  const [plusDesc, setPlusDesc] = useState("");
  const [plusCategory, setPlusCategory] = useState("");
  const [plusItemType, setPlusItemType] = useState("");
  const [plusCondition, setPlusCondition] = useState("");
  const [plusWeight, setPlusWeight] = useState("");
  const [plusAiLoading, setPlusAiLoading] = useState(false);
  const [plusAiSuggestion, setPlusAiSuggestion] = useState<{cat:string;item:string;conf:number}|null>(null);
  const [plusSelectedRoute, setPlusSelectedRoute] = useState("");
  const [plusDone, setPlusDone] = useState(false);
  const [plusShowCatPicker, setPlusShowCatPicker] = useState(false);
  const [plusShowItemTypePicker, setPlusShowItemTypePicker] = useState(false);
  const [plusShowConditionPicker, setPlusShowConditionPicker] = useState(false);
  const [actSection, setActSection] = useState<"Reports" | "Bookings" | "History">("Reports");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportModal, setReportModal] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [urgency, setUrgency] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [mapFilter, setMapFilter] = useState("All");
  const [mapStatusFilter, setMapStatusFilter] = useState("All");
  const [mapZoom, setMapZoom] = useState(1);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapDragging, setMapDragging] = useState(false);
  const mapDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [navigateLocation, setNavigateLocation] = useState<(typeof recycleLocations)[0] | null>(null);
  const [navPhase, setNavPhase] = useState<"select"|"active"|"arrived">("select");
  const [navTransport, setNavTransport] = useState<"walk"|"drive">("drive");
  const [navStep, setNavStep] = useState(0);
  const [recyclingModal, setRecyclingModal] = useState(false);
  const [recyclingStep, setRecyclingStep] = useState(1);
  const [recyclingMaterial, setRecyclingMaterial] = useState("");
  const [recyclingKg, setRecyclingKg] = useState("");
  const [recyclingPhoto, setRecyclingPhoto] = useState(false);
  const [recyclingDone, setRecyclingDone] = useState(false);
  const [recyclingPts, setRecyclingPts] = useState(0);
  const [recyclingPoints, setRecyclingPoints] = useState(0);
  const [totalRecycledKg, setTotalRecycledKg] = useState(0);
  const [recycleSessionCount, setRecycleSessionCount] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState("All");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyTimeFilter, setHistoryTimeFilter] = useState("All");
  const [rewardsSubPage, setRewardsSubPage] = useState<"" | "redeem" | "history" | "eligibility">("");
  const [profileSubPage, setProfileSubPage] = useState<"" | "editProfile" | "phone" | "email" | "addresses" | "notifications" | "feedback" | "language" | "switchAccount" | "sharedData">("");
  const [appLanguage, setAppLanguage] = useState<"en" | "ms">("en");
  const t = (key: TKey): string => (translations[appLanguage] as Record<TKey, string>)[key] ?? translations.en[key];
  const [langPending, setLangPending] = useState<"en" | "ms" | null>(null);
  const [showLangConfirm, setShowLangConfirm] = useState(false);
  const [showLangLoading, setShowLangLoading] = useState(false);
  const [profileOtpStep, setProfileOtpStep] = useState(false);
  const [profileOtpValue, setProfileOtpValue] = useState("");
  const [profileOtpError, setProfileOtpError] = useState("");
  const [profileOtpDone, setProfileOtpDone] = useState(false);
  const [epPhone, setEpPhone] = useState(() => {
    try { return localStorage.getItem("bingo_user_phone") || "+60 12-882 1923"; } catch { return "+60 12-882 1923"; }
  });
  const [epEmail, setEpEmail] = useState(() => {
    try { return localStorage.getItem("bingo_user_email") || ""; } catch { return ""; }
  });
  const [epZone, setEpZone] = useState(() => {
    try { return localStorage.getItem("bingo_user_zone") || "Zone E – City of Elmina"; } catch { return "Zone E – City of Elmina"; }
  });
  const [epArea, setEpArea] = useState(() => {
    try { return localStorage.getItem("bingo_user_area") || "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor"; } catch { return "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor"; }
  });
  const [epCollDay, setEpCollDay] = useState("Monday, Wednesday & Saturday");
  const [mapDisplayMode, setMapDisplayMode] = useState<"google" | "simplified">("google");
  const [reportAddress, setReportAddress] = useState("");
  const [reportZone, setReportZone] = useState("");
  const resetProfileOtp = () => { setProfileOtpStep(false); setProfileOtpValue(""); setProfileOtpError(""); setProfileOtpDone(false); };
  const [reminderSet, setReminderSet] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderChoice, setReminderChoice] = useState("");
  const [detailReportId, setDetailReportId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifs, setReadNotifs] = useState<number[]>([]);
  const [showLocation, setShowLocation] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Profile and Device Accounts states (dynamically bound to this Chrome browser)
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem("bingo_username") || "Resident"; } catch { return "Resident"; }
  });
  const [deviceAccounts, setDeviceAccounts] = useState<UserAccount[]>(() => getDeviceAccounts());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [epName, setEpName] = useState("");
  const [epCurPass, setEpCurPass] = useState("");
  const [epNewPass, setEpNewPass] = useState("");
  const [epConfirm, setEpConfirm] = useState("");
  const [epErrors, setEpErrors] = useState<Record<string, string>>({});
  const [epSaved, setEpSaved] = useState(false);
  const [userToast, setUserToast] = useState("");
  const showUserToast = (msg: string) => { setUserToast(msg); setTimeout(() => setUserToast(""), 3000); };

  function switchAccount(acc: UserAccount) {
    setUserName(acc.name);
    setEpEmail(acc.email);
    setEpZone(acc.zone);
    setEpArea(acc.area);
    setEpPhone(acc.phone);
    setEpCollDay(acc.collectionDays);
    try {
      localStorage.setItem("bingo_username", acc.name);
      localStorage.setItem("bingo_user_email", acc.email);
      localStorage.setItem("bingo_user_zone", acc.zone);
      localStorage.setItem("bingo_user_area", acc.area);
      localStorage.setItem("bingo_user_phone", acc.phone);
    } catch {}
    syncUserProfileToDb({
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      zone: acc.zone,
      area: acc.area,
      collectionDays: acc.collectionDays,
    });
    setProfileSubPage("");
    showUserToast(`Switched account to ${acc.name}`);
  }

  async function handleAddGoogleAccount() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const u = res.user;
        const name = u.displayName || u.email?.split("@")[0] || "Resident";
        const email = u.email || "";
        const phone = u.phoneNumber || "+60 12-882 1923";
        const photoURL = u.photoURL || undefined;

        const newAcc: UserAccount = {
          id: u.uid || `google_${Date.now()}`,
          name,
          email,
          avatar: name.charAt(0).toUpperCase() || "G",
          bg: "bg-emerald-600 text-white",
          zone: "Zone E – City of Elmina",
          area: "Kanopi Residences, City of Elmina, Shah Alam",
          phone,
          collectionDays: "Monday, Wednesday & Saturday",
          photoURL,
          provider: "google",
          lastLoginAt: Date.now(),
        };

        saveDeviceAccount(newAcc);
        setDeviceAccounts(getDeviceAccounts());
        switchAccount(newAcc);
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        showUserToast("Could not complete Google sign-in.");
      }
    }
  }

  function handleRemoveDeviceAccount(id: string, name: string) {
    removeDeviceAccount(id);
    const updated = getDeviceAccounts();
    setDeviceAccounts(updated);
    showUserToast(`Removed ${name} from this browser`);
  }

  // Real-time Firestore subscriptions for municipal data
  useEffect(() => {
    const unsubReports = subscribeToReports((data) => {
      if (data && data.length > 0) setReports(data);
    });
    const unsubSched = subscribeToSchedules((data) => {
      if (data && data.length > 0) setSchedules(data);
    });
    const unsubNotices = subscribeToNotices((data) => {
      if (data && data.length > 0) setNotices(data);
    });
    return () => {
      unsubReports();
      unsubSched();
      unsubNotices();
    };
  }, []);

  const [showMyRewards, setShowMyRewards] = useState(false);
  type RedeemedItem = { uid: number; id: number; name: string; icon: string; category: string; points: number; expiresAt: string; code: string };
  const [myRedeemedList, setMyRedeemedList] = useState<RedeemedItem[]>([]);
  const [qrReward, setQrReward] = useState<RedeemedItem | null>(null);

  const resetReportModal = () => {
    setReportModal(false);
    setReportStep(1);
    setIssueType("");
    setIssueDesc("");
    setUrgency("");
    setReportPhotos([]);
    setGpsActive(false);
    setGpsError(false);
    setShowGpsDialog(false);
  };

  const userPoints = reports.filter(r => r.status === "Completed").reduce((sum, r) => sum + r.points, 0) + recyclingPts;
  const totalReports = reports.length;
  const collectedCount = reports.filter(r => r.status !== "Pending").length * 4 + 36 + recycleSessionCount;
  const recycledKg = parseFloat((reports.filter(r => r.status === "Completed").length * 6 + 11 + totalRecycledKg).toFixed(1));

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-200/80 flex items-center justify-center sm:p-4">
        <LoginFlow onDone={(admin, displayName) => {
          setLoggedIn(true);
          setIsAdmin(!!admin);
          if (displayName) {
            setUserName(displayName);
            try { localStorage.setItem("bingo_username", displayName); } catch {}
          }
        }} />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-200/80 flex items-center justify-center sm:p-4 relative">
        <AdminPanel
          reports={reports} setReports={setReports}
          liveUpdates={liveUpdates} setLiveUpdates={setLiveUpdates}
          schedules={schedules} setSchedules={setSchedules}
          rewards={rewards} setRewards={setRewards}
          bins={bins} setBins={setBins}
          notices={notices} setNotices={setNotices}
          onLogout={() => setShowLogoutConfirm(true)}
        />
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3 mx-auto text-red-600">
                <LogOut className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{t("logout_title")}</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">{t("logout_body")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {t("logout_cancel")}
                </button>
                <button
                  onClick={() => {
                    signOut(auth).catch(() => {});
                    setLoggedIn(false);
                    setIsAdmin(false);
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                >
                  {t("logout_confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/80 flex items-center justify-center sm:p-4">
      {/* Mobile Application Canvas */}
      <div className="w-full max-w-[430px] mx-auto min-h-screen sm:min-h-[844px] sm:max-h-[92vh] bg-[#F8FAF9] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-0 sm:border sm:border-slate-300/80 flex flex-col relative select-none">
        
        {/* Mobile Status Bar */}
        <div className="px-6 pt-3 pb-1 flex justify-between items-center shrink-0 bg-[#133E26] text-white/90">
          <span className="text-[12px] font-semibold tabular-nums tracking-tight">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2.5 border border-white/80 rounded-xs p-0.5">
              <div className="h-full w-3/4 bg-white rounded-xs" />
            </div>
          </div>
        </div>

        {/* Municipal Header */}
        <header className="px-5 pb-4 pt-2.5 shrink-0 bg-[#133E26] text-white shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-200/80 text-[11px] font-medium tracking-wide uppercase">{t("header_welcome")}</p>
              <h1 className="text-white text-[17px] font-bold tracking-tight leading-tight truncate max-w-[190px]">
                {userName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("Rewards")}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2.2} />
                <span className="text-white text-xs font-bold tabular-nums">{userPoints.toLocaleString()}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNotifications(v => !v)}
                className="relative bg-white/10 hover:bg-white/15 border border-white/10 rounded-full p-2 text-white active:scale-95 transition-all"
              >
                <Bell className="w-4 h-4" strokeWidth={1.8} />
                {readNotifs.length < (3 + notices.length) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#133E26]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-full p-2 text-white active:scale-95 transition-all"
              >
                <User className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Notification Slide-down Tray ── */}
        <AnimatePresence>
          {showNotifications && (() => {
            const systemNotifs = [
              { id: 101, icon: Truck, title: "Truck arriving soon", body: "Collection vehicle WB-1234 is 12 min away from your zone.", time: "Just now" },
              { id: 104, icon: AlertTriangle, title: "Collection Delay Warning", body: "Today's General Waste collection in Zone A is delayed by approx 45 mins due to road repairs.", time: "30m ago" },
              { id: 102, icon: Calendar, title: "Collection scheduled tomorrow", body: "General Waste pickup tomorrow at 7:00 AM — Zone A.", time: "2h ago" },
              { id: 103, icon: CheckCircle2, title: "Report resolved", body: "Your report 'Illegal Dumping' has been resolved. Thank you!", time: "1d ago" },
            ];
            const pinnedAdminNotifs = notices.filter(n => n.pinned).map(n => ({ id: n.id, icon: Bell, title: n.title, body: n.body, time: new Date(n.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }));
            const unpinnedAdminNotifs = notices.filter(n => !n.pinned).map(n => ({ id: n.id, icon: Bell, title: n.title, body: n.body, time: new Date(n.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }));
            const allNotifs = [...pinnedAdminNotifs, ...systemNotifs, ...unpinnedAdminNotifs];
            const allIds = allNotifs.map(n => n.id);
            return (
              <div className="absolute inset-0 z-40 flex flex-col">
                <div className="bg-black/50 absolute inset-0 backdrop-blur-xs" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="relative z-10 bg-white rounded-b-3xl shadow-xl flex flex-col max-h-[75%] border-b border-slate-200"
                >
                  <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{t("notif_title")}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setReadNotifs(allIds)} className="text-xs font-semibold text-emerald-700 hover:underline">{t("notif_mark_read")}</button>
                      <button onClick={() => setShowNotifications(false)} className="bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 text-slate-600">
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {allNotifs.map(n => {
                      const Icon = n.icon;
                      const isRead = readNotifs.includes(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                          className={`flex gap-3 px-5 py-3 cursor-pointer transition-colors ${isRead ? "bg-white" : "bg-emerald-50/40"}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isRead ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-800"}`}>
                            <Icon className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs text-slate-900 truncate ${!isRead ? "font-bold" : "font-medium"}`}>{n.title}</p>
                              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{n.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* ── Main App Content (Native Touch Scroll) ── */}
        <main className="flex-1 overflow-y-auto mobile-app-scroll bg-[#F8FAF9]">

          {/* ══════════ TAB: HOME ══════════ */}
          {activeTab === "Home" && (
            <div className="p-4 space-y-4 pb-24">
              
              {/* Live Collection Progress */}
              <section aria-label="Live Collection">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("home_live")}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span>{t("header_realtime")}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {liveUpdates.map(truck => (
                    <div key={truck.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                            <Truck className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{truck.location}</p>
                            <p className="text-[11px] text-slate-500">{truck.date} · {truck.time}</p>
                          </div>
                        </div>
                        <div className="bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
                          {t("home_eta")} {truck.eta}
                        </div>
                      </div>

                      {/* Route Milestone Line */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>{t("home_depot")}</span>
                          <span className="text-emerald-700">{t("home_your_area")}</span>
                        </div>
                        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${truck.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                          <span>Departed</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{truck.progress}% completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Next Scheduled Collection */}
              <section aria-label="Next Collection">
                {(() => {
                  const nearest = [...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b)))[0];
                  const label = nearest ? `${nearest.day}, ${nearest.date} ${(nearest as any).month ?? ""} · ${nearest.time}` : "–";
                  const zone = nearest ? `${nearest.zone} — ${nearest.type}` : "";
                  return (
                    <div className="bg-gradient-to-br from-[#14532D] to-[#15803D] rounded-2xl p-4 text-white shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">{t("home_next_collection")}</span>
                          <p className="text-base font-bold mt-1 tracking-tight">{label}</p>
                          <p className="text-xs text-emerald-100/90 mt-0.5">{zone}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                          <Recycle className="w-5 h-5 text-emerald-200" strokeWidth={2} />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowReminderPicker(true)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${reminderSet ? "bg-white text-emerald-800 shadow-xs" : "bg-white/15 text-white hover:bg-white/20"}`}
                        >
                          <Bell className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{reminderSet ? reminderChoice : t("home_set_reminder")}</span>
                        </button>
                        <span className="text-[11px] text-emerald-200/80 font-medium">Zone A</span>
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* Collection Schedule Agenda */}
              <section aria-label="Upcoming Schedule" ref={scheduleRef}>
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("home_schedule")}</h2>
                  <span className="text-xs text-slate-400 font-medium">{t("home_nearest_first")}</span>
                </div>

                <div className="space-y-2.5">
                  {[...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b))).map((s, idx) => (
                    <div key={s.id} className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center gap-3 shadow-xs ${idx === 0 ? "border-emerald-300 ring-1 ring-emerald-300/40" : "border-slate-200/80"}`}>
                      <div className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 tabular-nums ${idx === 0 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                        <span className="text-[8px] font-bold uppercase tracking-wide opacity-80">{s.day.slice(0, 3)}</span>
                        <span className="text-base font-extrabold leading-none mt-0.5">{s.date}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.type}</p>
                        <p className="text-[11px] text-slate-500 truncate">{s.zone}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" strokeWidth={2} />
                          <span className="tabular-nums">{s.time}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {idx === 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {t("home_badge_next")}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                            {t("home_badge_soon")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══════════ TAB: MAP ══════════ */}
          {activeTab === "Map" && (
            <div className="p-4 space-y-3 pb-24" onClick={() => setActiveDropdown(null)}>
              {/* Map Mode Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Sime Darby Property Smart Collection</span>
                  </h2>
                  <p className="text-[10px] text-slate-500">Live navigation & authentic community eco stations</p>
                </div>
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setMapDisplayMode("google")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapDisplayMode === "google"
                        ? "bg-white text-emerald-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Google Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapDisplayMode("simplified")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapDisplayMode === "simplified"
                        ? "bg-white text-emerald-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Simplified
                  </button>
                </div>
              </div>

              {/* Map View Rendering */}
              {mapDisplayMode === "google" ? (
                <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  <GoogleMapView
                    userAddress={epArea}
                    userZone={epZone}
                    onSelectStation={(station) => {
                      const matchedBin = bins.find(b => b.id === station.id);
                      if (matchedBin) {
                        setNavigateLocation(matchedBin as any);
                        setNavPhase("select");
                        setNavStep(0);
                      }
                    }}
                  />
                </div>
              ) : (
                /* Map Preview Card (Simplified Canvas) */
                <div
                  className="relative h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-xs select-none"
                  style={{ background: "#CDE3D1", cursor: mapDragging ? "grabbing" : "grab" }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setMapDragging(true); mapDragRef.current = { sx: e.clientX, sy: e.clientY, ox: mapOffset.x, oy: mapOffset.y }; }}
                  onPointerMove={e => { if (!mapDragging || !mapDragRef.current) return; setMapOffset({ x: mapDragRef.current.ox + (e.clientX - mapDragRef.current.sx), y: mapDragRef.current.oy + (e.clientY - mapDragRef.current.sy) }); }}
                  onPointerUp={() => setMapDragging(false)}
                >
                  <div className="absolute inset-0" style={{ transform: `translate(${mapOffset.x}px,${mapOffset.y}px) scale(${mapZoom})`, transformOrigin: "center center", transition: mapDragging ? "none" : "transform 0.2s" }}>
                    <div className="absolute" style={{ inset: "-150%", background: "linear-gradient(155deg,#e0eee2 0%,#d2e8d6 50%,#c4e0c9 100%)" }} />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 208" preserveAspectRatio="none">
                      <path d="M10,108 Q50,107 82,107 Q120,106 165,107 Q200,108 250,110" stroke="#fff" strokeWidth="6" fill="none" opacity="0.8"/>
                      <path d="M70,40 Q74,68 76,100 Q78,118 74,140 Q70,160 60,180" stroke="#fff" strokeWidth="5" fill="none" opacity="0.75"/>
                      <path d="M40,60 Q60,78 80,96 Q96,108 110,120 Q128,134 148,145" stroke="#fff" strokeWidth="5" fill="none" opacity="0.7"/>
                      <path d="M120,30 Q128,68 131,100 Q132,120 128,145 Q124,165 118,185" stroke="#fff" strokeWidth="4" fill="none" opacity="0.6"/>
                      <path d="M82,107 Q90,112 106,114 Q118,115 125,118" stroke="#fff" strokeWidth="3" fill="none" opacity="0.5"/>
                    </svg>
                    {bins.filter(loc => matchesFilter(loc as any, mapFilter, mapStatusFilter)).map(loc => {
                      const fc = fillColor(loc.fill);
                      return (
                        <div key={loc.id} className="absolute cursor-pointer" style={{ left: loc.x, top: loc.y, transform: "translate(-50%,-50%)" }}
                          onClick={e => { e.stopPropagation(); setNavigateLocation(loc as any); setNavPhase("select"); setNavStep(0); }}>
                          <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: fc.dot }} />
                        </div>
                      );
                    })}
                    <div className="absolute" style={{ left: "30%", top: "52%", transform: "translate(-50%,-50%)" }}>
                      <div className="w-4 h-4 rounded-full bg-emerald-700 border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>

                  {/* Minimalist Glass Compass */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none bg-white/80 backdrop-blur-md rounded-xl p-1.5 border border-white/60 shadow-xs flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-800" strokeWidth={2.2} />
                    <span className="text-[10px] font-bold text-slate-800">Sime Darby</span>
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute right-2.5 bottom-2.5 flex flex-col gap-1 z-10 pointer-events-auto">
                    <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setMapZoom(z => Math.min(3, z + 0.3))} className="bg-white/90 backdrop-blur-md rounded-lg w-7 h-7 flex items-center justify-center shadow-xs border border-slate-200 text-sm font-bold text-slate-800 active:scale-95">+</button>
                    <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setMapZoom(z => Math.max(0.7, z - 0.3))} className="bg-white/90 backdrop-blur-md rounded-lg w-7 h-7 flex items-center justify-center shadow-xs border border-slate-200 text-sm font-bold text-slate-800 active:scale-95">−</button>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["All", "Recycling", "General", "E-Waste"].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMapFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${mapFilter === f ? "bg-emerald-700 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Station Listing */}
              <div className="space-y-2.5">
                {bins
                  .filter(loc => matchesFilter(loc as any, mapFilter, mapStatusFilter))
                  .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
                  .map(loc => {
                    const fc = fillColor(loc.fill);
                    const isOpen = loc.status === "Open";
                    const locLat = (loc as any).lat || 3.1868;
                    const locLng = (loc as any).lng || 101.5042;
                    const locAddr = (loc as any).address || (loc as any).township || "Sime Darby Property Township";
                    return (
                      <div key={loc.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-900 truncate">{loc.name}</h3>
                              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md ${isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                                {loc.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{locAddr}</p>
                            <p className="text-[10px] text-emerald-700 font-medium">{loc.type} · {loc.distance}</p>

                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${fc.bar}`} style={{ width: `${loc.fill}%` }} />
                              </div>
                              <span className="text-[11px] font-bold tabular-nums" style={{ color: fc.dot }}>{loc.fill}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <a
                            href={getGoogleMapsNavigationUrl(locLat, locLng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                          >
                            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Google Maps</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => { setNavigateLocation(loc as any); setNavPhase("select"); setNavStep(0); }}
                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                          >
                            <span>{t("map_navigate")}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ══════════ TAB: ACTIVITY ══════════ */}
          {activeTab === "Activity" && (
            <div className="p-4 space-y-3 pb-24">
              {/* Apple-style Segmented Control */}
              <div className="flex bg-slate-200/70 p-1 rounded-xl mb-3">
                {(["Reports", "Bookings", "History"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActSection(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${actSection === s ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {s === "Reports" ? t("act_reports") : s === "Bookings" ? t("act_bookings") : t("act_history")}
                  </button>
                ))}
              </div>

              {actSection === "Reports" && (
                <div className="space-y-3">
                  {/* Status Dropdown Filter */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-500 font-medium">Filter by status:</span>
                    <select
                      value={reportFilter}
                      onChange={e => setReportFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none shadow-xs"
                    >
                      {["All", "Pending", "In Action", "Completed", "Rejected"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reports list */}
                  {reports.filter(r => reportFilter === "All" || r.status === reportFilter).map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="text-xs font-bold text-slate-900">{r.issue}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
                        </div>
                        <span className={statusColors[r.status]}>{r.status}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.8} />
                          <span className="truncate max-w-[150px]">{r.address}</span>
                          <span>·</span>
                          <span className="tabular-nums">{r.time}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setDetailReportId(r.id)}
                          className="font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                        >
                          {t("act_view_details")} <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {actSection === "Bookings" && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-bold text-slate-900 mb-3">{t("act_upcoming")}</p>
                    <div className="divide-y divide-slate-100">
                      {schedules.map(s => (
                        <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{s.type}</p>
                            <p className="text-slate-500 text-[11px]">{s.zone} · {s.day}, {s.date} {s.time}</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                            {t("act_scheduled")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {actSection === "History" && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-bold text-slate-900 mb-2">{t("act_history_title")}</p>
                  <div className="divide-y divide-slate-100">
                    {reports.map(r => (
                      <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{r.issue}</p>
                          <p className="text-slate-400 text-[11px]">{r.time}</p>
                        </div>
                        <span className={statusColors[r.status]}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB: REWARDS ══════════ */}
          {activeTab === "Rewards" && (
            <div className="p-4 space-y-4 pb-24">
              
              {/* Rewards Points Hero */}
              <div className="bg-gradient-to-br from-[#133E26] via-[#15803D] to-[#16A34A] rounded-2xl p-5 text-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">{t("rew_total_pts")}</span>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight tabular-nums">{userPoints.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <Trophy className="w-6 h-6 text-amber-300" strokeWidth={2} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{totalReports}</p>
                    <p className="text-[10px] text-emerald-200">{t("act_reports")}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{collectedCount}</p>
                    <p className="text-[10px] text-emerald-200">{t("rew_collected")}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{recycledKg}</p>
                    <p className="text-[10px] text-emerald-200">{t("rew_recycled_kg")}</p>
                  </div>
                </div>
              </div>

              {/* Rewards Subpages */}
              {rewardsSubPage === "redeem" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("rew_redeem_title")}</h3>
                    <button
                      type="button"
                      onClick={() => setRewardsSubPage("")}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {rewards.map(r => {
                      const canRedeem = userPoints >= r.points;
                      return (
                        <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{r.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{r.name}</p>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {r.points} Green Points
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canRedeem}
                            onClick={() => {
                              const code = "BG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
                              const item: RedeemedItem = {
                                uid: Date.now(),
                                id: r.id,
                                name: r.name,
                                icon: r.icon,
                                category: r.category,
                                points: r.points,
                                expiresAt: "Valid 30 Days",
                                code,
                              };
                              setMyRedeemedList(prev => [item, ...prev]);
                              setQrReward(item);
                              addRedemptionToDb({
                                residentName: userName,
                                userEmail: epEmail,
                                rewardName: r.name,
                                pointsCost: r.points,
                                voucherCode: code,
                                expiresAt: "30 Days",
                              });
                              showUserToast(`Redeemed ${r.name}! Synced to database.`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              canRedeem
                                ? "bg-emerald-700 text-white shadow-xs active:scale-95"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Redeem
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : rewardsSubPage === "history" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("rew_pts_history")}</h3>
                    <button
                      type="button"
                      onClick={() => setRewardsSubPage("")}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      ← Back
                    </button>
                  </div>
                  {myRedeemedList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-xs">
                      <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Vouchers Claimed Yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">Redeem rewards using your accumulated Green Points above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myRedeemedList.map(item => (
                        <div key={item.uid} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Code: {item.code}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQrReward(item)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                          >
                            Show QR
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : rewardsSubPage === "eligibility" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("rew_eligibility")}</h3>
                    <button
                      type="button"
                      onClick={() => setRewardsSubPage("")}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Leaf className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Incident Reports</p>
                        <p className="text-[11px] text-slate-500">+8 points for resolved hazard reports verified by municipal teams.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Recycle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Drop-Off Recycling</p>
                        <p className="text-[11px] text-slate-500">10 points per kg deposited at verified smart drop stations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Navigation Cards */
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setRewardsSubPage("redeem")}
                    className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Gift className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t("rew_redeem_title")}</p>
                        <p className="text-[11px] text-slate-500">{rewards.length} {t("rew_available")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardsSubPage("history")}
                    className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Clock className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t("rew_pts_history")}</p>
                        <p className="text-[11px] text-slate-500">{t("rew_verified_credited")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardsSubPage("eligibility")}
                    className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Star className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t("rew_eligibility")}</p>
                        <p className="text-[11px] text-slate-500">{t("rew_all_unlocked")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB: GUIDE ══════════ */}
          {activeTab === "Guide" && (
            <div className="p-4 space-y-4 pb-24">
              <div className="bg-[#14532D] text-white rounded-2xl p-4 shadow-xs">
                <h2 className="text-sm font-bold tracking-tight">{t("guide_title")}</h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">{t("guide_subtitle")}</p>
              </div>

              {/* 4 Bins Specification */}
              <div className="space-y-3">
                {[
                  {
                    title: t("guide_green"),
                    subtitle: t("guide_green_sub"),
                    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
                    badge: "Organic",
                    items: ["Fruit & vegetable peelings", "Cooked food leftovers", "Coffee grounds & tea bags", "Garden trimmings"],
                  },
                  {
                    title: t("guide_blue"),
                    subtitle: t("guide_blue_sub"),
                    bg: "bg-sky-50 border-sky-200 text-sky-800",
                    badge: "Recyclables",
                    items: ["Rinsed plastic bottles", "Clean cardboard & paper", "Aluminium & tin beverage cans", "Glass jars"],
                  },
                  {
                    title: t("guide_black"),
                    subtitle: t("guide_black_sub"),
                    bg: "bg-slate-100 border-slate-200 text-slate-800",
                    badge: "General Waste",
                    items: ["Soiled food wraps", "Broken ceramics", "Polystyrene styrofoam", "Hygiene disposables"],
                  },
                  {
                    title: t("guide_ewaste"),
                    subtitle: t("guide_ewaste_sub"),
                    bg: "bg-purple-50 border-purple-200 text-purple-800",
                    badge: "Hazardous / E-Waste",
                    items: ["Phones & power adapters", "Batteries & power banks", "Laptops & cables", "Fluorescent lighting"],
                  },
                ].map(bin => (
                  <div key={bin.title} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-slate-900">{bin.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${bin.bg}`}>
                        {bin.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{bin.subtitle}</p>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {bin.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ── Fixed Mobile Bottom Tab Bar ── */}
        <nav className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around z-30 shadow-lg">
          {([
            { tab: "Home" as Tab, icon: Home, label: t("nav_home") },
            { tab: "Map" as Tab, icon: MapPin, label: t("nav_map") },
          ] as const).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${activeTab === tab ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={activeTab === tab ? 2.2 : 1.8} />
              <span className="text-[10px] tracking-tight">{label}</span>
            </button>
          ))}

          {/* Elevated Centre Action Button ("+") */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              type="button"
              onClick={() => {
                setShowPlusModal(true); setPlusStep(0); setPlusMode(""); setPlusPhoto(false); setPlusDesc("");
                setPlusCategory(""); setPlusItemType(""); setPlusCondition(""); setPlusWeight("");
                setPlusAiSuggestion(null); setPlusSelectedRoute(""); setPlusDone(false);
              }}
              className="w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform border-3 border-white ring-2 ring-emerald-700/20"
              aria-label="Dispose or Recycle Item"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {([
            { tab: "Activity" as Tab, icon: CalendarDays, label: t("nav_activity") },
            { tab: "Rewards" as Tab, icon: Trophy, label: t("nav_rewards") },
          ] as const).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${activeTab === tab ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={activeTab === tab ? 2.2 : 1.8} />
              <span className="text-[10px] tracking-tight">{label}</span>
            </button>
          ))}
        </nav>

        {/* ── Slide-up Profile Sheet ── */}
        <AnimatePresence>
          {showProfile && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => { setShowProfile(false); setProfileSubPage(""); }} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[82%] z-10"
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">
                    {profileSubPage === "language" ? t("prof_language") : profileSubPage === "feedback" ? t("prof_feedback") : profileSubPage === "switchAccount" ? "Select Account" : profileSubPage === "sharedData" ? "Information Shared" : t("prof_account")}
                  </h2>
                  <button onClick={() => { setShowProfile(false); setProfileSubPage(""); }} className="p-1 rounded-full bg-slate-100 text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4">
                  {profileSubPage === "" && (
                    <>
                      {/* Active Account Card */}
                      <div className="flex items-center justify-between bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{epEmail}</p>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {epZone} · {epArea}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("switchAccount")}
                          className="shrink-0 ml-2 px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 text-[11px] font-bold shadow-2xs transition-all"
                        >
                          Switch
                        </button>
                      </div>

                      {/* Main Settings Menu */}
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {/* Select / Switch Account */}
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("switchAccount")}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <User className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block">Select / Switch Account</span>
                              <span className="text-[10px] text-slate-400 block truncate">Choose another resident profile or Google account</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </button>

                        {/* Information Shared with BinGo */}
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("sharedData")}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block">Information Shared with BinGo</span>
                              <span className="text-[10px] text-slate-400 block truncate">Review data shared (Name, Email, Zone, etc.)</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </button>

                        {/* App Language */}
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("language")}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-emerald-700" />
                            <span className="font-semibold text-slate-800">{t("prof_language")}</span>
                          </div>
                          <span className="text-slate-400 font-medium">{appLanguage === "en" ? "English" : "Bahasa Melayu"}</span>
                        </button>

                        {/* Feedback */}
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("feedback")}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-emerald-700" />
                            <span className="font-semibold text-slate-800">{t("prof_feedback")}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setShowProfile(false); setShowLogoutConfirm(true); }}
                        className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("prof_signout")}</span>
                      </button>
                    </>
                  )}

                  {/* ── Subpage: Switch / Select Account ── */}
                  {profileSubPage === "switchAccount" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Choose Resident Account</h3>
                          <p className="text-[11px] text-slate-500">Accounts saved on this Chrome browser</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("")}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Back
                        </button>
                      </div>

                      {/* Info Notice about device-specific dynamic storage */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2">
                        <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Accounts shown here are dynamically remembered for this browser only. Strangers' accounts on other devices are never displayed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {deviceAccounts.length > 0 ? (
                          deviceAccounts.map(acc => {
                            const isActive = acc.name === userName || acc.email === epEmail;
                            return (
                              <div
                                key={acc.id}
                                onClick={() => switchAccount(acc)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left group shadow-xs ${
                                  isActive
                                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/15"
                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {acc.photoURL ? (
                                    <img src={acc.photoURL} alt={acc.name} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${acc.bg || "bg-emerald-700 text-white"}`}>
                                      {acc.avatar || acc.name.charAt(0)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                      <span>{acc.name}</span>
                                      {isActive && (
                                        <span className="text-[9px] font-extrabold bg-emerald-700 text-white px-1.5 py-0.2 rounded-full">
                                          Active
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-0.5 inline-block truncate max-w-[180px]">
                                      {acc.zone}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 ml-2 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                      isActive
                                        ? "bg-emerald-700 text-white cursor-default"
                                        : "bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700"
                                    }`}
                                  >
                                    {isActive ? "Current" : "Switch"}
                                  </button>
                                  {!isActive && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDeviceAccount(acc.id, acc.name);
                                      }}
                                      title="Remove from this browser"
                                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
                            <p className="text-xs font-semibold text-slate-700">No other saved accounts</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Accounts you sign into on this device will be listed here.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons: Google dynamic sign in & switch user */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAddGoogleAccount}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-600 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 shadow-2xs group"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="group-hover:text-slate-900">+ Add Another Google Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileSubPage("");
                            setShowProfile(false);
                            setLoggedIn(false);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 shadow-2xs"
                        >
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span>Sign into Another Account</span>
                        </button>
                      </div>

                      {/* Link to see shared data */}
                      <button
                        type="button"
                        onClick={() => setProfileSubPage("sharedData")}
                        className="w-full p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-left flex items-start gap-2.5 transition-colors hover:bg-emerald-50"
                      >
                        <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">See what information is shared with BinGo</p>
                          <p className="text-[11px] text-emerald-800/90 mt-0.5">
                            Transparency report on how your Name, Email, and Location are utilized.
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* ── Subpage: Information Shared with BinGo ── */}
                  {profileSubPage === "sharedData" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Information Shared with BinGo</h3>
                          <p className="text-[11px] text-slate-500">Data usage &amp; civic privacy transparency</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("")}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Back
                        </button>
                      </div>

                      <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-950">Active Resident Account: {userName}</p>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            The following details are securely linked to your BinGo application profile:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Name */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Name</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {userName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Identifies your household on residential waste schedules, personalizes your green points certificates, and marks your citizen incident reports.
                          </p>
                        </div>

                        {/* Email */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Email Address</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {epEmail}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Used to deliver collection timetable updates, municipal cleanup progress notifications, and digital voucher barcodes.
                          </p>
                        </div>

                        {/* Zone & Area */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Residential Area &amp; Zone</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {epZone} · {epArea}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Localizes the live waste fleet map, pickup frequency, and routes to your nearest recycling drop-off depot.
                          </p>
                        </div>

                        {/* Phone */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Phone Number</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {epPhone}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Used for urgent collection delay SMS notifications and multi-factor account verification.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("switchAccount")}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:bg-emerald-800 transition-colors"
                        >
                          Switch Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("")}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {profileSubPage === "language" && (
                    <div className="space-y-2">
                      {[
                        { code: "en" as const, label: "English", desc: "English (Malaysia)" },
                        { code: "ms" as const, label: "Bahasa Melayu", desc: "Bahasa Melayu (Rasmi)" },
                      ].map(l => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => { setAppLanguage(l.code); setProfileSubPage(""); }}
                          className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${appLanguage === l.code ? "border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          <div>
                            <p className="font-bold">{l.label}</p>
                            <p className="text-[11px] text-slate-500 font-normal">{l.desc}</p>
                          </div>
                          {appLanguage === l.code && <CheckCheck className="w-4 h-4 text-emerald-700" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {profileSubPage === "feedback" && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">{t("prof_fb_question")}</p>
                      <div className="flex gap-2 justify-center py-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setFeedbackRating(s)} className="p-1">
                            <Star className={`w-7 h-7 ${s <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder={t("prof_fb_ph")}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => { setProfileSubPage(""); setFeedbackRating(0); setFeedbackText(""); }}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                      >
                        {t("prof_fb_submit")}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Item Disposal Wizard Modal ── */}
        <AnimatePresence>
          {showPlusModal && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowPlusModal(false)} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85%] z-10"
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">{t("plus_title")}</h2>
                  <button onClick={() => setShowPlusModal(false)} className="p-1 rounded-full bg-slate-100 text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                  {plusStep === 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">{t("plus_choose_desc")}</p>

                      <button
                        type="button"
                        onClick={() => { setPlusMode("ai"); setPlusStep(1); }}
                        className="w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left flex items-start gap-3 transition-all active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">{t("plus_ai_title")}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{t("plus_ai_desc")}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-700 mt-2" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPlusMode("manual"); setPlusStep(1); }}
                        className="w-full p-4 rounded-2xl border border-slate-200 hover:border-slate-300 text-left flex items-start gap-3 transition-all active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">{t("plus_manual_title")}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{t("plus_manual_desc")}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 mt-2" />
                      </button>
                    </div>
                  )}

                  {plusStep === 1 && plusMode === "ai" && (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center bg-emerald-50/30 flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 text-emerald-700" strokeWidth={1.8} />
                        <p className="text-xs font-bold text-slate-800">{t("plus_take_upload")}</p>
                        <p className="text-[11px] text-slate-500 max-w-xs">{t("plus_ai_will")}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setPlusStep(2); setPlusSelectedRoute("Recycling Drop-off"); }}
                        className="w-full py-3 rounded-xl bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        {t("plus_simulate")}
                      </button>
                    </div>
                  )}

                  {plusStep >= 2 && (
                    <div className="space-y-4 text-center py-4">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{t("plus_all_done")}</h3>
                        <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                          {t("plus_route_done")} <strong className="text-emerald-700">{plusSelectedRoute || "Recycling Facility"}</strong>.
                        </p>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowPlusModal(false); setActiveTab("Map"); }}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        >
                          {t("plus_find_pt")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlusModal(false)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          {t("btn_close")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Report Issue Modal ── */}
        <AnimatePresence>
          {reportModal && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={resetReportModal} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85%] z-10"
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">{t("rep_title")} ({t("rep_step")} {reportStep}/3)</h2>
                  <button onClick={resetReportModal} className="p-1 rounded-full bg-slate-100 text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                  {reportStep === 1 && (
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700">{t("rep_issue_type")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Overflowing Bin", "Illegal Dumping", "Missed Collection", "Damaged Bin"].map(issue => (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => setIssueType(issue)}
                            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${issueType === issue ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                          >
                            {issue}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-bold text-slate-700 mb-1 block">{t("rep_desc")}</label>
                        <textarea
                          value={issueDesc}
                          onChange={e => setIssueDesc(e.target.value)}
                          placeholder={t("rep_desc_ph")}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!issueType || !issueDesc.trim()}
                        onClick={() => setReportStep(2)}
                        className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mt-2 ${issueType && issueDesc.trim() ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                      >
                        {t("btn_next")}
                      </button>
                    </div>
                  )}

                  {reportStep === 2 && (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-5 h-5 text-emerald-700" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{t("rep_gps")}</p>
                            <p className="text-[11px] text-slate-500">{gpsActive ? t("rep_gps_captured") : t("rep_gps_tap")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGpsActive(true)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${gpsActive ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
                        >
                          {gpsActive ? "Verified" : "Pin GPS"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newReport = {
                            id: Date.now(),
                            issue: issueType,
                            description: issueDesc,
                            address: "Taman Jaya, PJ",
                            urgency: "High",
                            status: "Pending",
                            points: 8,
                            time: "Just now",
                            photo: true,
                            adminComment: "",
                            completedAt: undefined,
                            timeline: ["Submitted · just now"],
                            authorName: userName,
                            authorEmail: epEmail,
                          };
                          setReports(prev => [newReport, ...prev]);
                          addReportToDb(newReport);
                          resetReportModal();
                          setActiveTab("Activity");
                          showUserToast("Report submitted & synced to database!");
                        }}
                        className="w-full py-3 rounded-xl bg-emerald-700 text-white text-xs font-semibold shadow-xs mt-3"
                      >
                        {t("btn_submit")}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Report Details Modal ── */}
        <AnimatePresence>
          {detailReportId !== null && (() => {
            const r = reports.find(x => x.id === detailReportId);
            if (!r) return null;
            return (
              <div className="absolute inset-0 z-50 flex flex-col justify-end">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDetailReportId(null)} />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="relative bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[85%] overflow-y-auto z-10"
                >
                  <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{r.issue}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{r.address}</p>
                    </div>
                    <span className={statusColors[r.status]}>{r.status}</span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                    <p className="text-xs text-slate-700 leading-relaxed">{r.description}</p>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mb-2">{t("det_timeline")}</p>
                  <div className="space-y-2 mb-4">
                    {(r.timeline || [`Submitted · ${r.time}`]).map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailReportId(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    {t("btn_close")}
                  </button>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3 mx-auto text-red-600">
                <LogOut className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{t("logout_title")}</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">{t("logout_body")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {t("logout_cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOut(auth).catch(() => {});
                    setLoggedIn(false);
                    setIsAdmin(false);
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                >
                  {t("logout_confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
