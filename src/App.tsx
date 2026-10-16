import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Calendar, AlertTriangle, Search, Bell, Navigation, Camera, Star, Trophy,
  ChevronRight, Truck, Recycle, Upload, Clock, CheckCircle, CheckCircle2, Leaf, User,
  Phone, ArrowLeft, Home, MessageSquare, X, Plus, Mail, LogOut, BookOpen, Key,
  CheckCheck, Filter, SlidersHorizontal, ArrowUp, ArrowRight, CornerUpLeft, CornerUpRight,
  Flag, CalendarDays, Shield, Pencil, Pin, PinOff, LayoutDashboard, FileText, Gift, Globe,
  BellOff, Car, Footprints, Trash2, ExternalLink, Info, Check, XCircle, Sparkles,
} from "lucide-react";
import LoginFlow from "./LoginFlow";
import AdminPanel from "./AdminPanel";
import {
  recycleLocations, SimpleQR, fillColor, matchesFilter, getCompassDir, calcETA, todayLabel,
  initialSchedules, initialLiveUpdates, initialReports, leaderboard, initialRewards,
  urgencyColors, statusColors, initialNotices, schedSortKey, PRESET_ACCOUNTS,
  getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, getReportTimeScore, getReportElapsedMinutes,
  MANUAL_CATEGORIES, CATEGORY_ITEM_TYPES, MANUAL_CONDITIONS,
  initialDisposedItems, AI_SAMPLE_ITEMS,
} from "./appData";
import type { Bin, Report, LiveUpdate, Schedule, Reward, Notice, NavStep, UserAccount, DisposedItemRecord } from "./appData";
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
    act_reports:"Reports", act_bookings:"Disposed Items", act_disposed:"Disposed Items", act_history:"History",
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
    act_reports:"Laporan", act_bookings:"Barangan Dilupus", act_disposed:"Barangan Dilupus", act_history:"Sejarah",
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

export interface ManualGuideItem {
  id: string;
  name: string;
  category: "Recyclables" | "Organic" | "General Waste" | "E-Waste" | "Bulky";
  icon: string;
  bin: string;
  binBg: string;
  binColor: string;
  binText: string;
  rule: string;
  points?: number;
  route: string;
  accepted: string[];
  notAccepted: string[];
  tips: string[];
  prepSteps: string[];
}

export const MANUAL_GUIDE_ITEMS: ManualGuideItem[] = [
  {
    id: "pet-bottles",
    name: "Plastic Drink Bottles",
    category: "Recyclables",
    icon: "🍾",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Empty liquid, rinse thoroughly, and crush flat. Caps and labels can stay attached.",
    points: 15,
    route: "Smart Recyclables Depot",
    prepSteps: [
      "Pour out all remaining drink and liquid residue.",
      "Quickly rinse with water to avoid mould and insect attraction.",
      "Crush flat under foot to save municipal bin capacity.",
    ],
    accepted: ["Mineral water bottles", "Soft drink / soda bottles", "Cooking oil bottles (rinsed)", "Clear juice containers"],
    notAccepted: ["Oil bottles with heavy grime", "Pesticide or chemical bottles", "Plastic wrap or soft films"],
    tips: ["Crushing bottles reduces volume by 70%, allowing trucks to collect more efficiently."],
  },
  {
    id: "hdpe-plastics",
    name: "Hard Plastic Bottles",
    category: "Recyclables",
    icon: "🧴",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Rinse shampoo or detergent bottles. Remove pump nozzles if they contain internal metal springs.",
    points: 15,
    route: "Smart Recyclables Depot",
    prepSteps: [
      "Drain all soap, detergent, or shampoo thoroughly.",
      "Rinse with clean water and let drain dry.",
      "Unscrew pump heads if they contain metal springs; throw pumps into General Waste.",
    ],
    accepted: ["Shampoo & conditioner bottles", "Laundry detergent jugs", "Milk jugs & yoghurt tubs (rinsed)", "Cleaning spray bottles"],
    notAccepted: ["Plastic tubs contaminated with grease", "Toothpaste tubes (multi-layer)"],
    tips: ["Hard plastic is remanufactured into municipal park benches and drainage pipes."],
  },
  {
    id: "aluminium-cans",
    name: "Aluminium Drink Cans",
    category: "Recyclables",
    icon: "🥫",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Rinse beverage residue and crush flat. Aluminium is 100% infinitely recyclable.",
    points: 20,
    route: "Smart Recyclables Depot",
    prepSteps: [
      "Rinse out sugary sodas, tea, or beer residue with water.",
      "Leave pull-tab attached to the can.",
      "Step on or compress the can flat.",
    ],
    accepted: ["Soft drink cans", "Coffee & energy drink cans", "Sparkling water cans", "Beer cans"],
    notAccepted: ["Aerosol spray cans with propellant gas (use hazardous point)", "Cans with cigarette butts"],
    tips: ["Recycling 1 aluminium can saves enough electricity to power a TV for 3 hours."],
  },
  {
    id: "cardboard-boxes",
    name: "Cardboard Boxes & Cartons",
    category: "Recyclables",
    icon: "📦",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Peel off plastic tape, remove styrofoam, flatten boxes, and ensure they remain completely dry.",
    points: 15,
    route: "Eco Station",
    prepSteps: [
      "Remove all plastic bubble wrap, tape, and styrofoam.",
      "Break down and flatten boxes completely.",
      "Bundle with string or stack inside a flat box to keep dry.",
    ],
    accepted: ["Shipping & courier cardboard", "Cereal & pantry dry food boxes", "Shoe boxes", "Egg cartons (clean paper pulp)"],
    notAccepted: ["Wet or soaked cardboard", "Oily pizza takeaway boxes", "Wax-coated seafood boxes"],
    tips: ["Wet cardboard jams sorting conveyor belts and will be discarded at the MRF."],
  },
  {
    id: "newspapers-paper",
    name: "Clean Paper, Books & Magazines",
    category: "Recyclables",
    icon: "📰",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Stack and bundle clean paper flat. Keep free of food stains and moisture.",
    points: 12,
    route: "Eco Station",
    prepSteps: [
      "Sort out non-paper plastic covers and metal spiral bindings.",
      "Stack flat in bundles.",
      "Store indoors until collection day to protect from rain.",
    ],
    accepted: ["Daily newspapers", "Glossy magazines & brochures", "School notebooks & office A4 paper", "Paper envelopes"],
    notAccepted: ["Thermal cash register receipts (contain BPA/BPS)", "Carbon paper", "Laminated paper"],
    tips: ["Thermal receipts cannot be recycled because the chemical coating contaminates paper pulp."],
  },
  {
    id: "glass-jars",
    name: "Glass Bottles & Food Jars",
    category: "Recyclables",
    icon: "🫙",
    bin: "Blue Bin (Recyclables)",
    binBg: "bg-sky-50",
    binColor: "border-sky-300",
    binText: "text-sky-800",
    rule: "Rinse food jars thoroughly. Separate metal lids. Never put broken drinking glasses or ceramics here.",
    points: 10,
    route: "Recycling Facility",
    prepSteps: [
      "Empty contents and rinse with warm water.",
      "Unscrew metal or plastic lids and recycle separately.",
      "Keep jars intact — avoid smashing glass before drop-off.",
    ],
    accepted: ["Jam & condiment glass jars", "Soy sauce & syrup glass bottles", "Beverage glass bottles"],
    notAccepted: ["Window pane glass", "Automotive windshields", "Mirrors and lightbulbs", "Ceramics & drinking glasses"],
    tips: ["Glass bottles can be recycled endlessly with zero loss in purity or quality."],
  },
  {
    id: "food-scraps",
    name: "Food Leftovers & Kitchen Scraps",
    category: "Organic",
    icon: "🥗",
    bin: "Green Bin (Organic)",
    binBg: "bg-emerald-50",
    binColor: "border-emerald-300",
    binText: "text-emerald-800",
    rule: "Drain gravy and excess broth. Do not wrap in regular plastic bags.",
    route: "Organic Composting Depot",
    prepSteps: [
      "Drain liquid broth and oils through a sink strainer.",
      "Place into compostable bag or direct organic bucket.",
      "Deposit daily into the green organic bin to prevent odour.",
    ],
    accepted: ["Cooked meal leftovers", "Rice, noodles, and bread crusts", "Vegetable stalks and fruit rinds", "Eggshells"],
    notAccepted: ["Cooking oil (recycle as used cooking oil)", "Large animal bones", "Plastic wrapping & toothpicks"],
    tips: ["Sime Darby organic waste is processed into community fertilizer for township landscaping."],
  },
  {
    id: "fruit-peels",
    name: "Fruit & Vegetable Peels",
    category: "Organic",
    icon: "🍌",
    bin: "Green Bin (Organic)",
    binBg: "bg-emerald-50",
    binColor: "border-emerald-300",
    binText: "text-emerald-800",
    rule: "Raw botanical matter composts rapidly. Remove fruit stickers and rubber bands.",
    route: "Organic Composting Depot",
    prepSteps: [
      "Peel off PLU barcode stickers on bananas, apples, and oranges.",
      "Remove plastic tags, bread clips, and rubber bands.",
      "Discard into green organic waste container.",
    ],
    accepted: ["Banana peels, orange rinds, apple cores", "Potato and carrot peelings", "Watermelon rinds", "Herb stems"],
    notAccepted: ["Plastic produce netting", "Fruit packaging foam nets"],
    tips: ["Fruit peels decompose into rich nutrient compost within 4 weeks."],
  },
  {
    id: "garden-leaves",
    name: "Garden Clippings & Branches",
    category: "Organic",
    icon: "🍂",
    bin: "Green Bin (Garden Biomass)",
    binBg: "bg-emerald-50",
    binColor: "border-emerald-300",
    binText: "text-emerald-800",
    rule: "Tie branches into 1-metre bundles. Place dry leaves in paper lawn bags.",
    route: "Garden Biomass Stream",
    prepSteps: [
      "Trim tree branches to under 1 metre in length.",
      "Tie bundles securely with biodegradable twine.",
      "Place fallen leaves and grass clippings into paper sacks.",
    ],
    accepted: ["Lawn grass clippings", "Pruned tree branches", "Dead leaves and potted plant soil"],
    notAccepted: ["Treated or varnished timber", "Plastic plant pots", "Synthetic garden turf"],
    tips: ["Scheduled municipal collection picks up tied garden waste every Wednesday."],
  },
  {
    id: "smartphones-laptops",
    name: "Old Smartphones, Laptops & Tablets",
    category: "E-Waste",
    icon: "📱",
    bin: "Special E-Waste Depot",
    binBg: "bg-purple-50",
    binColor: "border-purple-300",
    binText: "text-purple-800",
    rule: "Perform factory reset to wipe personal data. Keep batteries intact.",
    points: 30,
    route: "Certified E-Waste Depot",
    prepSteps: [
      "Back up photos and data, then perform factory reset.",
      "Do not puncture or crush the device battery.",
      "Drop off at a verified BinGo smart e-waste bin.",
    ],
    accepted: ["Old mobile phones & smartphones", "Tablets & iPads", "Laptops & motherboards", "Smartwatches"],
    notAccepted: ["Leaking swollen lithium batteries (handle with sand/fire container)"],
    tips: ["E-waste contains precious gold, copper, and palladium that are recovered safely."],
  },
  {
    id: "batteries",
    name: "Household Batteries & Power Banks",
    category: "E-Waste",
    icon: "🔋",
    bin: "Special E-Waste Depot",
    binBg: "bg-purple-50",
    binColor: "border-purple-300",
    binText: "text-purple-800",
    rule: "Tape over metal terminals with clear tape to prevent short circuits and fire hazards.",
    points: 25,
    route: "Certified E-Waste Depot",
    prepSteps: [
      "Apply clear tape over the positive and negative terminals of 9V and lithium batteries.",
      "Place into a dry transparent zip bag.",
      "Deposit into the specialized e-waste battery compartment.",
    ],
    accepted: ["AA, AAA, C, D alkaline batteries", "Rechargeable Li-ion batteries", "Power banks", "Button cell watch batteries"],
    notAccepted: ["Leaking car lead-acid batteries (bring to automotive service shop)"],
    tips: ["Never toss batteries into general garbage; they can ignite garbage collection compactors."],
  },
  {
    id: "chargers-cables",
    name: "Power Cables, Adapters & Appliances",
    category: "E-Waste",
    icon: "🔌",
    bin: "Special E-Waste Depot",
    binBg: "bg-purple-50",
    binColor: "border-purple-300",
    binText: "text-purple-800",
    rule: "Wind electrical cables neatly. Small electrical appliances are accepted at e-waste hubs.",
    points: 20,
    route: "Certified E-Waste Depot",
    prepSteps: [
      "Bundle cables neatly with twist ties or rubber bands.",
      "Keep power adapters and chargers together.",
      "Deposit in the designated small electronic appliances bin.",
    ],
    accepted: ["Phone charging cords & USB cables", "Laptop power bricks & wall chargers", "Electric kettles, toasters, hair dryers", "Computer mice & keyboards"],
    notAccepted: ["Commercial refrigeration units with freon gas"],
    tips: ["Copper wiring inside electrical cords is purified and re-drawn into new cables."],
  },
  {
    id: "soiled-packaging",
    name: "Soiled Food Wrappers & Oily Boxes",
    category: "General Waste",
    icon: "🥡",
    bin: "Black Bin (General Waste)",
    binBg: "bg-slate-100",
    binColor: "border-slate-300",
    binText: "text-slate-800",
    rule: "Greasy takeaway wrappers and oily pizza boxes destroy paper recycling. Put in black bin.",
    route: "Household Scheduled Pickup",
    prepSteps: [
      "Scrape remaining food into the green organic bin.",
      "Fold soiled paper wrapper or oily box.",
      "Tie in standard municipal rubbish bag and place in black bin.",
    ],
    accepted: ["Oily pizza takeaway boxes", "Nasi lemak greaseproof paper", "Waxed paper cups", "Soiled napkins & wet tissues"],
    notAccepted: ["Clean, ungreased cardboard (belongs in Blue Bin)"],
    tips: ["Grease binds to paper fibres and cannot be washed out during recycling."],
  },
  {
    id: "styrofoam-boxes",
    name: "Polystyrene / Styrofoam Takeaway",
    category: "General Waste",
    icon: "🍚",
    bin: "Black Bin (General Waste)",
    binBg: "bg-slate-100",
    binColor: "border-slate-300",
    binText: "text-slate-800",
    rule: "Polystyrene styrofoam is non-recyclable in curbside bins. Bag tightly to prevent wind litter.",
    route: "Household Scheduled Pickup",
    prepSteps: [
      "Scrape all food scraps out of the styrofoam container.",
      "Stack takeaway boxes together.",
      "Seal securely in a trash bag for the black bin.",
    ],
    accepted: ["Styrofoam lunchboxes & meal trays", "Instant cup noodle foam containers", "Moulded appliance packaging styrofoam"],
    notAccepted: ["Clean recyclable plastic boxes & containers"],
    tips: ["Use reusable lunch containers when purchasing takeaway to eliminate styrofoam waste."],
  },
  {
    id: "broken-ceramics",
    name: "Broken Ceramics & Glassware",
    category: "General Waste",
    icon: "🍽️",
    bin: "Black Bin (General Waste)",
    binBg: "bg-slate-100",
    binColor: "border-slate-300",
    binText: "text-slate-800",
    rule: "Ceramics and heat-resistant Pyrex have different melting temperatures. Wrap shards safely in newspaper.",
    route: "Household Scheduled Pickup",
    prepSteps: [
      "Wrap sharp shards securely in 3-4 layers of newspaper.",
      "Tape around the newspaper package to prevent puncture.",
      "Label 'SHARP / GLASS' on the package to protect municipal workers.",
    ],
    accepted: ["Broken porcelain plates & ceramic mugs", "Drinking glasses & wine glasses", "Pyrex baking dishes", "Ceramic flower pots"],
    notAccepted: ["Glass jars and food bottles (these belong in the Blue Bin!)"],
    tips: ["Drinking glass melts at 1500°C while jar glass melts at 1200°C, so they cannot be mixed."],
  },
  {
    id: "bulky-furniture",
    name: "Furniture, Mattresses & Large Items",
    category: "Bulky",
    icon: "🛋️",
    bin: "Bulk Waste Appointment",
    binBg: "bg-amber-50",
    binColor: "border-amber-300",
    binText: "text-amber-800",
    rule: "Requires dedicated municipal bulk pickup. Contact council or schedule an appointment.",
    route: "Bulk Pickup Appointment",
    prepSteps: [
      "Dismantle large wooden bed frames or tables if possible.",
      "Cover mattresses with plastic if storing outside prior to pickup.",
      "Schedule your bulky collection via the Activity / Request tab.",
    ],
    accepted: ["Wooden tables, chairs, bookshelves", "Sofas and mattresses", "Large wardrobes and mirrors", "Carpets and rugs"],
    notAccepted: ["Hazardous industrial chemicals", "Demolition bricks & concrete rubble"],
    tips: ["Sime Darby community conducts monthly bulky collection drives on designated Saturdays."],
  },
];

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
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [showProfile, setShowProfile] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [plusStep, setPlusStep] = useState(0);
  const [plusMode, setPlusMode] = useState<"ai" | "manual" | "">("");
  const [plusPhoto, setPlusPhoto] = useState(false);
  const [plusPhotoUrl, setPlusPhotoUrl] = useState<string>("");
  const [plusDesc, setPlusDesc] = useState("");
  const [plusCategory, setPlusCategory] = useState("");
  const [plusItemType, setPlusItemType] = useState("");
  const [plusCondition, setPlusCondition] = useState("");
  const [plusWeight, setPlusWeight] = useState("");
  const [plusAiLoading, setPlusAiLoading] = useState(false);
  const [plusAiSuggestion, setPlusAiSuggestion] = useState<{cat:string;item:string;conf:number}|null>(null);
  const [plusSelectedRoute, setPlusSelectedRoute] = useState("");
  const [plusDetectedItem, setPlusDetectedItem] = useState("Used T-Shirt");
  const [plusConfidence, setPlusConfidence] = useState(85);
  const [plusDone, setPlusDone] = useState(false);
  const [catBoxOpen, setCatBoxOpen] = useState(true);
  const [itemTypeBoxOpen, setItemTypeBoxOpen] = useState(true);
  const [conditionBoxOpen, setConditionBoxOpen] = useState(true);
  const [catScrollProgress, setCatScrollProgress] = useState(0);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [plusShowCatPicker, setPlusShowCatPicker] = useState(false);
  const [plusShowItemTypePicker, setPlusShowItemTypePicker] = useState(false);
  const [plusShowConditionPicker, setPlusShowConditionPicker] = useState(false);
  const [plusGuideSearch, setPlusGuideSearch] = useState("");
  const [plusGuideCategory, setPlusGuideCategory] = useState("All");
  const [selectedGuideItem, setSelectedGuideItem] = useState<ManualGuideItem | null>(null);
  const [guideViewMode, setGuideViewMode] = useState<"bins" | "materials">("bins");
  const [guideSearch, setGuideSearch] = useState("");
  const [guideCategory, setGuideCategory] = useState("All");
  const [actSection, setActSection] = useState<"Reports" | "Disposed Items">("Reports");
  const [disposedItems, setDisposedItems] = useState<DisposedItemRecord[]>(() => {
    try {
      const saved = localStorage.getItem("bingo_disposed_items");
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDisposedItems;
  });

  useEffect(() => {
    try {
      localStorage.setItem("bingo_disposed_items", JSON.stringify(disposedItems));
    } catch {}
  }, [disposedItems]);
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
  const [selectedMapStationId, setSelectedMapStationId] = useState<number | null>(null);
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

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuota);
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
    setReportAddress("");
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
      <div className="w-full max-w-[420px] mx-auto min-h-screen sm:min-h-[850px] sm:max-h-[96vh] sm:h-[850px] bg-[#F8FAF9] sm:rounded-[2.8rem] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col relative select-none ring-1 ring-slate-900/10">
        
        {/* Google Maps Platform Quota Notice Banner */}
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-[11px] text-center sticky top-0 z-50 shadow-sm shrink-0">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{" "}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{" "}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Mobile Top Dynamic Island / Speaker Pill on Desktop */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#133E26] shrink-0">
          <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Municipal Header with Mobile Status Bar */}
        <header className="px-5 pb-3.5 pt-2 shrink-0 bg-[#133E26] text-white shadow-xs">
          {/* Mobile Status Bar Simulation */}
          <div className="flex items-center justify-between text-white/80 text-[11px] font-semibold mb-2 px-0.5">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tracking-wider">5G</span>
              <div className="w-4 h-2 border border-white/80 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>

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
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${reminderSet ? "bg-white text-emerald-800 shadow-xs" : "bg-white/15 text-white hover:bg-white/20"}`}
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

              {/* Material Guide Quick Access Card */}
              <section aria-label="Waste & Material Guide">
                <div
                  onClick={() => setActiveTab("Guide")}
                  className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        Residential Waste & Material Guide
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Blue, Green, Black & E-Waste sorting specifications
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </section>
            </div>
          )}

          {/* ══════════ TAB: MAP ══════════ */}
          {activeTab === "Map" && (
            <div className="p-4 space-y-3 pb-24" onClick={() => setActiveDropdown(null)}>
              {/* Map Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Sime Darby Property Smart Collection</span>
                  </h2>
                  <p className="text-[10px] text-slate-500">Live navigation & authentic community eco stations</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Google Map Live</span>
                </div>
              </div>

              {/* Map View Rendering */}
              <div className="h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <GoogleMapView
                  userAddress={epArea}
                  userZone={epZone}
                  selectedStationId={selectedMapStationId ?? undefined}
                />
              </div>

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
                    const isSelected = selectedMapStationId === loc.id;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedMapStationId(loc.id)}
                        className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs space-y-2.5 cursor-pointer ${
                          isSelected
                            ? "border-emerald-600 ring-2 ring-emerald-600/15"
                            : "border-slate-200/80 hover:border-emerald-300"
                        }`}
                      >
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

                        {/* Direct Google Maps Navigation */}
                        <div className="pt-1 border-t border-slate-100">
                          <a
                            href={getGoogleMapsNavigationUrl(locLat, locLng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all text-center cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions in Google Maps</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ══════════ TAB: ACTIVITY ══════════ */}
          {/* ══════════ TAB: ACTIVITY ══════════ */}
          {activeTab === "Activity" && (
            <div className="p-4 space-y-4 pb-24">
              {/* Apple-style Segmented Control */}
              <div className="flex bg-slate-200/70 p-1 rounded-xl">
                {(["Reports", "Disposed Items"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActSection(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${actSection === s ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {s === "Reports" ? t("act_reports") : t("act_disposed")}
                  </button>
                ))}
              </div>

              {actSection === "Reports" && (
                <div className="space-y-3">
                  {/* Filter & + Report Button Header */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-medium">Filter:</span>
                      <select
                        value={reportFilter}
                        onChange={e => setReportFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none shadow-xs"
                      >
                        {["All", "Pending", "In Action", "Completed", "Rejected"].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReportModal(true);
                        setReportStep(1);
                        setIssueType("");
                        setIssueDesc("");
                        setGpsActive(false);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      <span>+ Report</span>
                    </button>
                  </div>

                  {/* Reports list - Sorted from recently to old */}
                  {(() => {
                    const sortedReports = [...reports]
                      .filter(r => reportFilter === "All" || r.status === reportFilter)
                      .sort((a, b) => getReportTimeScore(b) - getReportTimeScore(a));

                    if (sortedReports.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl p-7 border border-slate-200/80 text-center space-y-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">No Reports Found</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">No reports match the status "{reportFilter}".</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReportModal(true);
                              setReportStep(1);
                              setIssueType("");
                              setIssueDesc("");
                              setGpsActive(false);
                            }}
                            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>+ Report Issue</span>
                          </button>
                        </div>
                      );
                    }

                    return sortedReports.map(r => (
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
                            <span className="tabular-nums font-medium text-emerald-800">{r.time}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setDetailReportId(r.id)}
                            className="font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {t("act_view_details")} <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {actSection === "Disposed Items" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Recycle className="w-4 h-4 text-emerald-700" />
                        <span>Disposed Items History</span>
                      </h3>
                      <p className="text-[10px] text-slate-500">Classification &amp; drop-off records at Eco Stations</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {disposedItems.length} Logged
                    </span>
                  </div>

                  {/* Disposed items list sorted recently first */}
                  {(() => {
                    const sortedDisposed = [...disposedItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                    if (sortedDisposed.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center space-y-2 shadow-xs">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">No Disposed Items Yet</p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Log materials you drop off at Sime Darby Eco Stations to earn Green Points and track diversion.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusModal(true);
                              setPlusStep(0);
                              setPlusMode("");
                            }}
                            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>+ Log Material</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {sortedDisposed.map(item => {
                          const isNew = item.time === "Just now" || (item.createdAt && Date.now() - item.createdAt < 300000);
                          const timeDisplay = (() => {
                            if (!item.createdAt) return item.time || "Recently";
                            const diffMs = Date.now() - item.createdAt;
                            const diffSec = Math.floor(diffMs / 1000);
                            if (diffSec < 60) return "Just now";
                            const diffMin = Math.floor(diffSec / 60);
                            if (diffMin < 60) return `${diffMin}m ago`;
                            const diffHour = Math.floor(diffMin / 60);
                            if (diffHour < 24) return `${diffHour}h ago`;
                            const diffDay = Math.floor(diffHour / 24);
                            return `${diffDay}d ago`;
                          })();

                          return (
                            <div
                              key={item.id}
                              className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs space-y-2 ${
                                isNew ? "border-emerald-500/80 ring-2 ring-emerald-500/10" : "border-slate-200/80"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 border border-slate-200/60">
                                    {item.icon || "♻️"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.itemName}</h4>
                                      {isNew && (
                                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                                          NEW
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                      {item.category} · <span className="font-semibold text-emerald-800">{item.bin}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[11px] px-2 py-0.5 rounded-lg tabular-nums">
                                    +{item.points} pts
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.facility || "Sime Darby Eco Station"}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-medium text-slate-600">{item.weight}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1 text-slate-500 tabular-nums font-medium">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {timeDisplay}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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
            <div className="p-4 space-y-3.5 pb-24">
              <div className="bg-[#14532D] text-white rounded-2xl p-4 shadow-xs">
                <h2 className="text-sm font-bold tracking-tight">{t("guide_title")}</h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">{t("guide_subtitle")}</p>
              </div>

              {/* Segmented Mode Selector */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setGuideViewMode("bins")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    guideViewMode === "bins"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  4 Bins Standard
                </button>
                <button
                  type="button"
                  onClick={() => setGuideViewMode("materials")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    guideViewMode === "materials"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Material Directory ({MANUAL_GUIDE_ITEMS.length})
                </button>
              </div>

              {guideViewMode === "bins" ? (
                /* 4 Bins Specification */
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
              ) : (
                /* Material Directory & Search */
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={guideSearch}
                      onChange={e => setGuideSearch(e.target.value)}
                      placeholder="Search material rules (e.g. plastic, cans, battery)..."
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all shadow-2xs"
                    />
                    {guideSearch && (
                      <button
                        type="button"
                        onClick={() => setGuideSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {["All", "Recyclables", "Organic", "General Waste", "E-Waste", "Bulky"].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setGuideCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          guideCategory === cat
                            ? "bg-emerald-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Materials Listing */}
                  <div className="space-y-2.5">
                    {MANUAL_GUIDE_ITEMS
                      .filter(item => {
                        const matchesCat = guideCategory === "All" || item.category === guideCategory;
                        const q = guideSearch.trim().toLowerCase();
                        const matchesQuery = !q ||
                          item.name.toLowerCase().includes(q) ||
                          item.rule.toLowerCase().includes(q) ||
                          item.bin.toLowerCase().includes(q) ||
                          item.category.toLowerCase().includes(q);
                        return matchesCat && matchesQuery;
                      })
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedGuideItem(item)}
                          className="bg-white border border-slate-200/80 hover:border-emerald-500 rounded-2xl p-3.5 shadow-2xs transition-all space-y-2 cursor-pointer active:scale-[0.99] group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-2xl shrink-0 bg-slate-50 group-hover:bg-emerald-50 p-1.5 rounded-xl transition-colors">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-900 transition-colors">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${item.binBg} ${item.binColor} ${item.binText}`}>
                                    {item.bin}
                                  </span>
                                  {item.points && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      +{item.points} pts/kg
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGuideItem(item);
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 group-hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                            >
                              Details <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="bg-slate-50 group-hover:bg-emerald-50/40 rounded-xl p-2.5 text-[11px] text-slate-600 leading-relaxed border border-slate-100 flex items-start gap-2 transition-colors">
                            <span className="text-emerald-700 font-bold shrink-0">Rule:</span>
                            <span>{item.rule}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* ── Fixed Mobile Bottom Tab Bar ── */}
        <nav className="flex shrink-0 bg-white border-t border-slate-200 px-2 py-1.5 items-center justify-between z-30 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab("Home")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Home" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <Home className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Home" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{t("nav_home")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("Map")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Map" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <MapPin className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Map" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{t("nav_map")}</span>
          </button>

          {/* Elevated Centre Action Button ("+") */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={() => {
                setShowPlusModal(true); setPlusStep(0); setPlusMode(""); setPlusPhoto(false); setPlusDesc("");
                setPlusCategory(""); setPlusItemType(""); setPlusCondition(""); setPlusWeight("");
                setPlusAiSuggestion(null); setPlusSelectedRoute(""); setPlusDone(false);
                setPlusGuideSearch(""); setPlusGuideCategory("All"); setSelectedGuideItem(null);
              }}
              className="w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform border-3 border-white ring-2 ring-emerald-700/20 cursor-pointer"
              aria-label="Dispose or Recycle Item"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("Activity")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Activity" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Activity" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{t("nav_activity")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("Guide")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Guide" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Guide" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{t("nav_guide")}</span>
          </button>
        </nav>

        {/* Mobile Bottom Home Bar Indicator */}
        <div className="hidden sm:block py-1.5 bg-white shrink-0">
          <div className="w-28 h-1 bg-slate-900/20 rounded-full mx-auto" />
        </div>

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
                      <div className="flex items-center bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
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

                        {/* Waste Guidelines & Material Guide */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfile(false);
                            setActiveTab("Guide");
                          }}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block">{t("prof_guidelines")}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{t("prof_guidelines_sub")}</span>
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

                      <div className="space-y-2.5 text-xs">
                        {/* Name */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <User className="w-3.5 h-3.5 text-emerald-700" />
                            Name
                          </span>
                          <p className="text-sm font-bold text-slate-900">{userName}</p>
                        </div>

                        {/* Email */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Mail className="w-3.5 h-3.5 text-emerald-700" />
                            Email Address
                          </span>
                          <p className="text-sm font-bold text-slate-900">{epEmail}</p>
                        </div>

                        {/* Zone & Area */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                            Residential Area &amp; Zone
                          </span>
                          <p className="text-sm font-bold text-slate-900">{epZone} · {epArea}</p>
                        </div>

                        {/* Phone */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            Phone Number
                          </span>
                          <p className="text-sm font-bold text-slate-900">{epPhone}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("")}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
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
                {(plusMode === "manual" || plusMode === "ai") && plusStep >= 1 ? (
                  <div className="border-b border-slate-100">
                    <div className="px-5 pb-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (plusStep === 1) {
                            setPlusStep(0);
                            setPlusMode("");
                          } else {
                            setPlusStep(s => s - 1);
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="text-center">
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">
                          {plusMode === "ai" ? (
                            <>
                              {plusStep === 1 && "Capture Item"}
                              {plusStep === 2 && "AI Analysis"}
                              {plusStep === 3 && "Review & Confirm"}
                              {plusStep === 4 && "Disposal Path"}
                              {plusStep === 5 && "Facility Review"}
                              {plusStep === 6 && "Next Action"}
                            </>
                          ) : (
                            <>
                              {plusStep === 1 && "Item Details"}
                              {plusStep === 2 && "Confirm Details"}
                              {plusStep === 3 && "Disposal Path"}
                              {plusStep === 4 && "Management Review"}
                              {plusStep === 5 && "Next Action"}
                            </>
                          )}
                        </h2>
                        <p className="text-[11px] text-[#236B37] font-semibold mt-0.5">
                          Step {plusStep} of {plusMode === "ai" ? 6 : 5}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPlusModal(false)}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Segments */}
                    <div className="flex gap-1.5 px-5 pb-3">
                      {(plusMode === "ai" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]).map(stepNum => (
                        <div
                          key={stepNum}
                          className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                            stepNum <= plusStep ? "bg-[#236B37]" : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900">{t("plus_title")}</h2>
                    <button onClick={() => setShowPlusModal(false)} className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-5 overflow-y-auto space-y-3">
                  {plusStep === 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">{t("plus_choose_desc")}</p>

                      <button
                        type="button"
                        onClick={() => {
                          setPlusCategory("Paper / Cardboard");
                          setPlusItemType("Cardboard Box");
                          setPlusCondition("Good");
                          setPlusWeight("");
                          setPlusDesc("");
                          setPlusDetectedItem("Cardboard Box");
                          setPlusSelectedRoute("Recycling Drop-off");
                          setPlusConfidence(92);
                          setPlusPhoto(false);
                          setPlusPhotoUrl("");
                          setPlusAiLoading(false);
                          setPlusMode("ai");
                          setPlusStep(1);
                        }}
                        className="w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer"
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
                        onClick={() => {
                          setPlusCategory("Plastic");
                          setPlusItemType("");
                          setPlusCondition("");
                          setPlusWeight("");
                          setCatBoxOpen(true);
                          setItemTypeBoxOpen(true);
                          setConditionBoxOpen(true);
                          setCatScrollProgress(0);
                          setPlusMode("manual");
                          setPlusStep(1);
                        }}
                        className="w-full p-4 rounded-2xl border border-slate-200 hover:border-slate-300 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer"
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

                  {/* ══════════ AI CAMERA ASSISTANT: 6-STEP LOGICAL FLOW ══════════ */}
                  {/* ══════════ AI CAMERA ASSISTANT: 6-STEP LOGICAL FLOW ══════════ */}
                  {plusStep === 1 && plusMode === "ai" && (() => {
                    const isStep1Valid = Boolean(plusPhoto);
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Photo Ready / Capture Box (Image 1) */}
                        <div className="border-2 border-dashed border-emerald-600 rounded-3xl p-6 text-center bg-[#EAF5ED] flex flex-col items-center justify-center space-y-2 shadow-2xs">
                          {plusPhoto ? (
                            <>
                              <div className="w-12 h-12 rounded-full border-2 border-emerald-700 flex items-center justify-center text-emerald-700 bg-white shadow-2xs mx-auto">
                                <Check className="w-6 h-6 stroke-[3]" />
                              </div>
                              <p className="text-sm font-bold text-emerald-950 mt-1">Photo ready for AI analysis</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setPlusPhoto(false);
                                  setPlusPhotoUrl("");
                                }}
                                className="text-xs text-emerald-700 font-medium hover:underline cursor-pointer"
                              >
                                Tap to change photo
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full border-2 border-emerald-700/40 flex items-center justify-center text-emerald-700 bg-white/70 mx-auto">
                                <Camera className="w-6 h-6 text-emerald-700" />
                              </div>
                              <p className="text-sm font-bold text-emerald-950 mt-1">No photo uploaded yet</p>
                              <label className="text-xs text-emerald-700 font-medium hover:underline cursor-pointer">
                                <span>Tap to take or upload a photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = ev => {
                                        setPlusPhotoUrl(ev.target?.result as string);
                                        setPlusPhoto(true);
                                        setPlusConfidence(92);
                                        setPlusDetectedItem("Cardboard Box");
                                        setPlusCategory("Paper / Cardboard");
                                        setPlusItemType("Newspaper");
                                        setPlusCondition("Good");
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </>
                          )}
                        </div>

                        {/* Simulate Photo Upload Button (Image 1) */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextState = !plusPhoto;
                              setPlusPhoto(nextState);
                              if (nextState) {
                                setPlusPhotoUrl("https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80");
                                setPlusConfidence(92);
                                setPlusDetectedItem("Cardboard Box");
                                setPlusCategory("Paper / Cardboard");
                                setPlusItemType("Newspaper");
                                setPlusCondition("Good");
                              } else {
                                setPlusPhotoUrl("");
                              }
                            }}
                            className="w-full py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${plusPhoto ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-slate-400 text-transparent"}`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <span>Simulate Photo Upload</span>
                          </button>
                        </div>

                        {/* Action Button: Analyse with AI → (Image 1) */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={!isStep1Valid}
                            onClick={() => {
                              if (isStep1Valid) {
                                setPlusAiLoading(true);
                                setPlusStep(2);
                                setTimeout(() => setPlusAiLoading(false), 1200);
                              }
                            }}
                            className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-xs transition-all text-center flex items-center justify-center gap-2 ${
                              isStep1Valid
                                ? "bg-[#236B37] hover:bg-[#1b552b] text-white cursor-pointer active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <span>Analyse with AI →</span>
                          </button>
                          {!isStep1Valid && (
                            <p className="text-[10px] text-amber-700 text-center font-medium mt-1.5">
                              Every field is required to be filled before continuing to next step. (Photo required)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 2: AI ANALYSIS (Images 2 & 3) ══════════ */}
                  {plusStep === 2 && plusMode === "ai" && (() => {
                    if (plusAiLoading) {
                      return (
                        /* Spinner Screen (Image 2) */
                        <div className="py-14 text-center space-y-4">
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Analysing your photo...</h3>
                            <p className="text-xs text-emerald-700 mt-1">AI is identifying the item and best disposal route</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      /* AI Suggestion Screen (Image 3) */
                      <div className="space-y-4 pb-2">
                        <div className="bg-[#EAF5ED] border border-emerald-200/90 rounded-3xl p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1B6D36] text-white flex items-center justify-center shadow-xs">
                                <Star className="w-4 h-4 fill-white" />
                              </div>
                              <h4 className="text-xs font-bold text-emerald-950">AI Suggestion</h4>
                            </div>
                            <span className="bg-[#D4EDDA] text-[#155724] border border-[#C3E6CB] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {plusConfidence || 92}% confidence
                            </span>
                          </div>

                          <div className="divide-y divide-emerald-200/60 pt-1 text-xs">
                            <div className="py-2.5 flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Detected Item</span>
                              <span className="font-bold text-slate-900">{plusDetectedItem || "Cardboard Box"}</span>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Category</span>
                              <span className="font-bold text-slate-900">{plusCategory || "Paper / Cardboard"}</span>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Condition (AI Detected)</span>
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">{plusCondition || "Good"}</span>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Suggested Route</span>
                              <span className="font-bold text-[#1B6D36]">{plusSelectedRoute || "Recycling Drop-off"}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 text-center">
                          AI advises, not decides. You confirm the final details.
                        </p>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setPlusStep(3)}
                            className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Review &amp; Confirm →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 3: REVIEW & CONFIRM (Image 4) ══════════ */}
                  {plusStep === 3 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[0];
                    const isStep3Valid = Boolean(
                      plusCategory.trim() &&
                      plusItemType.trim() &&
                      plusWeight.trim()
                    );

                    return (
                      <div className="space-y-3 pb-2">
                        <p className="text-xs text-emerald-700">AI suggestion is pre-filled. Tap any field to correct it.</p>

                        {/* Row 1: Category (Image 4) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Category <span className="text-red-500">*</span></span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{selectedCatObj.icon}</span>
                                <span>{plusCategory}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setPlusShowCatPicker(!plusShowCatPicker)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors"
                              >
                                {plusShowCatPicker ? "Close" : "Change"}
                              </button>
                            </div>
                          </div>
                          {plusShowCatPicker && (
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                              {MANUAL_CATEGORIES.map(cat => (
                                <button
                                  key={cat.name}
                                  type="button"
                                  onClick={() => {
                                    setPlusCategory(cat.name);
                                    setPlusShowCatPicker(false);
                                    const items = CATEGORY_ITEM_TYPES[cat.name];
                                    if (items && items.length > 0) setPlusItemType(items[0]);
                                  }}
                                  className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    plusCategory === cat.name
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{cat.icon}</span>
                                  <span className="truncate">{cat.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Row 2: Item Type (Image 4) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Item Type <span className="text-red-500">*</span></span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">{plusItemType || "Newspaper"}</span>
                              <button
                                type="button"
                                onClick={() => setPlusShowItemTypePicker(!plusShowItemTypePicker)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors"
                              >
                                {plusShowItemTypePicker ? "Close" : "Change"}
                              </button>
                            </div>
                          </div>
                          {plusShowItemTypePicker && (
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                              {(CATEGORY_ITEM_TYPES[plusCategory] || ["Newspaper", "Cardboard Box", "Magazine", "Office Paper"]).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setPlusItemType(type);
                                    setPlusShowItemTypePicker(false);
                                  }}
                                  className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                                    plusItemType === type
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Row 3: Quantity / Weight (Image 4 - Required) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <label className="text-xs font-bold text-slate-900 block">
                            Quantity / Weight <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={plusWeight}
                            onChange={e => setPlusWeight(e.target.value)}
                            placeholder="e.g. 2 items or 3.5 kg"
                            className="w-full bg-[#EAF5ED] border border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 font-medium placeholder:text-slate-400"
                          />
                        </div>

                        {/* Action Button: Continue → (Image 4) */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={!isStep3Valid}
                            onClick={() => {
                              if (isStep3Valid) setPlusStep(4);
                            }}
                            className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-xs transition-all text-center ${
                              isStep3Valid
                                ? "bg-[#236B37] hover:bg-[#1b552b] text-white cursor-pointer active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Continue →
                          </button>
                          {!isStep3Valid && (
                            <p className="text-[10px] text-amber-700 text-center font-medium mt-1.5">
                              Every field is required to be filled before continuing to next step.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 4: DISPOSAL PATH ══════════ */}
                  {plusStep === 4 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 20;
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Target Sorting Stream Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designated Bin &amp; Path</span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedCatObj.targetColor}`}>
                              {selectedCatObj.bin}
                            </span>
                          </div>

                          <div className="bg-[#F4F9F5] rounded-xl p-3 flex items-center gap-3">
                            <span className="text-3xl shrink-0">{selectedCatObj.icon}</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{plusItemType || plusDetectedItem} ({plusCategory})</h4>
                              <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                Earn +{ptsEarned} Green Points per kg
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sorting & Preparation Guidelines */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Sorting &amp; Disposal Instructions</span>
                          </h4>
                          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <p>Ensure items are emptied of residue and clean from food oil or moisture.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <p>Remove non-recyclable caps, staples, or adhesive seals if separable.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <p>Pack securely or flatten to optimize community drop-off capacity.</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(3)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlusStep(5)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Next: Facility Review →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 5: FACILITY REVIEW ══════════ */}
                  {plusStep === 5 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 20;
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Nearest Eco Facility Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-700" />
                              <span>Nearest Sime Darby Eco Facility</span>
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Open · 7am - 9pm
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-900">Elmina Central Park Eco Station</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Elmina Promenade, City of Elmina (0.8 km)</p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                              <span className="font-semibold text-emerald-700">✓ RFID Smart Bin</span>
                              <span>·</span>
                              <span>✓ QR Scale Terminal</span>
                            </div>
                          </div>
                        </div>

                        {/* Disposal Method */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
                          <p className="text-xs font-bold text-slate-800">Selected Disposal Method</p>
                          <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#236B37]" />
                              <span className="text-xs font-bold text-emerald-950">Self Drop-off at Eco Station</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-800">Instant QR</span>
                          </div>
                          <p className="text-[10px] text-slate-500 pl-1">
                            Resident: <span className="font-semibold text-slate-800">{userName || "Wei En Lee"}</span> ({epZone || "Zone E – City of Elmina"})
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(4)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const finalWeight = parseFloat(plusWeight) || 0.6;
                              const newRecord: DisposedItemRecord = {
                                id: `disp-${Date.now()}`,
                                itemName: plusItemType || plusDetectedItem || `${plusCategory} Material`,
                                category: plusCategory || "Plastic",
                                icon: selectedCatObj.icon || "♻️",
                                bin: selectedCatObj.bin || "Blue Bin (Recyclables)",
                                weight: `${finalWeight} kg`,
                                condition: plusCondition || "Clean & Empty",
                                points: ptsEarned,
                                facility: "Elmina Central Park Eco Station",
                                status: "Logged",
                                time: "Just now",
                                createdAt: Date.now(),
                              };
                              setDisposedItems(prev => [newRecord, ...prev]);
                              setRecyclingPts(prev => prev + ptsEarned);
                              setTotalRecycledKg(prev => +(prev + finalWeight).toFixed(1));
                              setRecycleSessionCount(prev => prev + 1);

                              addRecycleSessionToDb({
                                residentName: userName || "Resident",
                                userEmail: epEmail || "resident@bingo.my",
                                stationName: "Elmina Central Park Eco Station",
                                materialType: `${plusCategory} - ${plusItemType || plusDetectedItem}`,
                                weightKg: finalWeight,
                                pointsEarned: ptsEarned,
                              });
                              showUserToast(`Material logged! +${ptsEarned} Green Points awarded.`);
                              setPlusStep(6);
                            }}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Submit &amp; Log Material →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 6: NEXT ACTION (SUCCESS & COMPLETION) ══════════ */}
                  {plusStep === 6 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 20;
                    return (
                      <div className="space-y-4 text-center py-2 pb-2">
                        {/* Big Green Success Badge */}
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                          <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">Disposal Logged Successfully!</h3>
                          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                            Your drop-off has been verified and registered in the Sime Darby Property smart recycling ledger.
                          </p>
                        </div>

                        {/* Rewards Card */}
                        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-4 text-center space-y-1">
                          <span className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-wider">Rewards Credited</span>
                          <p className="text-2xl font-extrabold text-[#1B5E20] tabular-nums">+{ptsEarned} Green Points</p>
                          <p className="text-[11px] text-[#2E7D32]">Added to your resident account wallet</p>
                        </div>

                        {/* Action Buttons: Navigate to Eco Station, Log Another & Done / View Activity */}
                        <div className="space-y-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusModal(false);
                              setActiveTab("Map");
                            }}
                            className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Navigate to Eco Station</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPlusStep(1);
                                setPlusDetectedItem("PET Mineral Bottle");
                                setPlusCategory("Plastic");
                                setPlusItemType("Drink Bottles");
                                setPlusCondition("Clean & Empty");
                                setPlusWeight("0.6");
                                setPlusConfidence(97);
                                setPlusPhotoUrl("");
                              }}
                              className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                            >
                              + Scan Another
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Activity");
                                setActSection("Disposed Items");
                              }}
                              className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            >
                              Done / View Activity
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ MANUAL MATERIAL GUIDE: 5-STEP LOGICAL FLOW ══════════ */}
                  {plusStep === 1 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory);
                    const availableItemTypes = CATEGORY_ITEM_TYPES[plusCategory] || ["Bottles", "Containers", "Bags", "Packaging"];

                    // ALL columns are strictly required before Continue button can be clicked
                    const isStep1Valid = Boolean(
                      plusCategory.trim() &&
                      plusItemType.trim() &&
                      plusCondition.trim() &&
                      plusWeight.trim()
                    );

                    const handleCatScroll = (e: React.UIEvent<HTMLDivElement>) => {
                      const target = e.currentTarget;
                      const maxScroll = target.scrollWidth - target.clientWidth;
                      if (maxScroll > 0) {
                        setCatScrollProgress(Math.min(1, Math.max(0, target.scrollLeft / maxScroll)));
                      }
                    };

                    return (
                      <div className="space-y-3 pb-2">
                        {/* 1. Category Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</span>
                            <div className="flex items-center gap-2">
                              {selectedCatObj && (
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                  <span>{selectedCatObj.icon}</span>
                                  <span>{selectedCatObj.name}</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setCatBoxOpen(!catBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {catBoxOpen ? "Close" : "Open"}
                              </button>
                            </div>
                          </div>

                          {catBoxOpen && (
                            <div className="space-y-2.5 pt-0.5">
                              {/* Horizontally sliding 2-row category grid */}
                              <div
                                ref={catScrollRef}
                                onScroll={handleCatScroll}
                                className="grid grid-rows-2 grid-flow-col auto-cols-[104px] gap-2 overflow-x-auto scroll-smooth py-1 px-0.5 no-scrollbar touch-pan-x"
                                style={{ scrollSnapType: "x mandatory" }}
                              >
                                {MANUAL_CATEGORIES.map(cat => {
                                  const isSelected = plusCategory === cat.name;
                                  return (
                                    <button
                                      key={cat.name}
                                      type="button"
                                      style={{ scrollSnapAlign: "start" }}
                                      onClick={() => {
                                        setPlusCategory(cat.name);
                                        const validTypes = CATEGORY_ITEM_TYPES[cat.name] || [];
                                        if (!validTypes.includes(plusItemType)) {
                                          setPlusItemType("");
                                        }
                                      }}
                                      className={`h-[78px] p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all select-none ${
                                        isSelected
                                          ? "bg-[#236B37] text-white border-transparent shadow-xs scale-[0.98]"
                                          : "bg-[#F4F9F5] hover:bg-emerald-50/70 border-emerald-100/60 text-slate-800 hover:border-emerald-300"
                                      }`}
                                    >
                                      <span className="text-2xl shrink-0">{cat.icon}</span>
                                      <span className="text-[10.5px] font-bold leading-tight truncate max-w-[94px]">
                                        {cat.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Interactive Slide Bar Track & Indicator */}
                              <div className="flex flex-col items-center gap-1 pt-1 select-none">
                                <div className="relative w-44 h-5 flex items-center justify-center">
                                  {/* Visual Track */}
                                  <div className="w-full h-2 bg-slate-100 border border-slate-200/90 rounded-full overflow-hidden relative shadow-2xs">
                                    <div
                                      className="h-full bg-[#236B37] rounded-full transition-transform duration-75 ease-out shadow-xs"
                                      style={{
                                        width: "42px",
                                        transform: `translateX(${catScrollProgress * (176 - 42)}px)`,
                                      }}
                                    />
                                  </div>

                                  {/* Range input overlay for direct touch/mouse sliding */}
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Math.round(catScrollProgress * 100)}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setCatScrollProgress(val / 100);
                                      if (catScrollRef.current) {
                                        const maxScroll = catScrollRef.current.scrollWidth - catScrollRef.current.clientWidth;
                                        catScrollRef.current.scrollLeft = (val / 100) * maxScroll;
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                                    aria-label="Slide to browse all categories"
                                  />
                                </div>

                                <span className="text-[10px] text-slate-400 font-medium">
                                  ← Slide bar to browse all {MANUAL_CATEGORIES.length} categories →
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Item Type Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Type</span>
                            <div className="flex items-center gap-2">
                              {plusItemType ? (
                                <span className="text-xs font-bold text-slate-900">{plusItemType}</span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Tap to select</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setItemTypeBoxOpen(!itemTypeBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {itemTypeBoxOpen ? "Close" : "Open"}
                              </button>
                            </div>
                          </div>

                          {itemTypeBoxOpen && (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {availableItemTypes.map(type => {
                                const isSelected = plusItemType === type;
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setPlusItemType(type)}
                                    className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-[#236B37] text-white border-[#236B37] shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 3. Condition Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</span>
                            <div className="flex items-center gap-2">
                              {plusCondition ? (
                                <span className="text-xs font-bold text-slate-900">{plusCondition}</span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Tap to select</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setConditionBoxOpen(!conditionBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {conditionBoxOpen ? "Close" : "Open"}
                              </button>
                            </div>
                          </div>

                          {conditionBoxOpen && (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {MANUAL_CONDITIONS.map(cond => {
                                const isSelected = plusCondition === cond;
                                return (
                                  <button
                                    key={cond}
                                    type="button"
                                    onClick={() => setPlusCondition(cond)}
                                    className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-[#236B37] text-white border-[#236B37] shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    {cond}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 4. Quantity / Weight (Required) Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2 shadow-2xs">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Quantity / Weight</span>
                            <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">(required)</span>
                          </label>
                          <input
                            type="text"
                            value={plusWeight}
                            onChange={e => setPlusWeight(e.target.value)}
                            placeholder="e.g. 2 items or 3.5 kg"
                            className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#236B37] focus:ring-1 focus:ring-[#236B37]/30 transition-all shadow-2xs"
                          />
                        </div>

                        {/* Continue Button: Enabled ONLY when all columns are filled */}
                        <div className="pt-1">
                          <button
                            type="button"
                            disabled={!isStep1Valid}
                            onClick={() => {
                              if (isStep1Valid) {
                                setPlusStep(2);
                              }
                            }}
                            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all text-center ${
                              isStep1Valid
                                ? "bg-[#236B37] hover:bg-[#1b552b] text-white cursor-pointer active:scale-95 shadow-sm"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Continue →
                          </button>
                          {!isStep1Valid && (
                            <p className="text-[10px] text-slate-400 text-center mt-1.5">
                              Please select Category, Item Type, Condition, and specify Quantity/Weight to proceed.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 2: CONFIRM DETAILS (Screenshot 3) ══════════ */}
                  {plusStep === 2 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Summary Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 divide-y divide-slate-100 shadow-2xs">
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Category</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{selectedCatObj.icon}</span>
                              <span>{plusCategory}</span>
                            </span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Item Type</span>
                            <span className="font-bold text-slate-900">{plusItemType}</span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Condition</span>
                            <span className="font-bold text-slate-900">{plusCondition}</span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Quantity / Weight</span>
                            <span className="font-bold text-slate-900">{plusWeight}</span>
                          </div>
                        </div>

                        {/* Green Confirmation Notice Banner */}
                        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-3 flex items-center gap-2.5 text-xs text-[#1B5E20]">
                          <CheckCircle className="w-4 h-4 text-[#2E7D32] shrink-0" />
                          <span>Please confirm the details are correct before proceeding.</span>
                        </div>

                        {/* Action Buttons: Edit & Confirm */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(1)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlusStep(3)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Confirm →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 3: DISPOSAL PATH & GUIDELINES ══════════ */}
                  {plusStep === 3 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 15;
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Target Sorting Stream Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designated Bin & Path</span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedCatObj.targetColor}`}>
                              {selectedCatObj.bin}
                            </span>
                          </div>

                          <div className="bg-[#F4F9F5] rounded-xl p-3 flex items-center gap-3">
                            <span className="text-3xl shrink-0">{selectedCatObj.icon}</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{plusItemType} ({plusCategory})</h4>
                              <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                Earn +{ptsEarned} Green Points per kg
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Preparation Guidelines */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Sorting & Disposal Instructions</span>
                          </h4>
                          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <p>Ensure items are emptied of residue and clean from food oil or moisture.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <p>Remove non-recyclable caps, staples, or adhesive seals if separable.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <p>Pack securely or flatten to optimize community drop-off capacity.</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(2)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlusStep(4)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Next: Facility Review →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 4: MANAGEMENT REVIEW ══════════ */}
                  {plusStep === 4 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 15;
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Nearest Eco Facility Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-700" />
                              <span>Nearest Sime Darby Eco Facility</span>
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Open · 7am - 9pm
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-900">Elmina Central Park Eco Station</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Elmina Promenade, City of Elmina (0.8 km)</p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                              <span className="font-semibold text-emerald-700">✓ RFID Smart Bin</span>
                              <span>·</span>
                              <span>✓ QR Scale Terminal</span>
                            </div>
                          </div>
                        </div>

                        {/* Disposal Method */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
                          <p className="text-xs font-bold text-slate-800">Selected Disposal Method</p>
                          <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#236B37]" />
                              <span className="text-xs font-bold text-emerald-950">Self Drop-off at Eco Station</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-800">Instant QR</span>
                          </div>
                          <p className="text-[10px] text-slate-500 pl-1">
                            Resident: <span className="font-semibold text-slate-800">{userName || "Wei En Lee"}</span> ({epZone || "Zone E – City of Elmina"})
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(3)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const finalWeight = parseFloat(plusWeight) || 1.5;
                              const newRecord: DisposedItemRecord = {
                                id: `disp-${Date.now()}`,
                                itemName: plusItemType || (plusCategory ? `${plusCategory} Material` : "Recyclable Item"),
                                category: plusCategory || "Plastic",
                                icon: selectedCatObj.icon || "♻️",
                                bin: selectedCatObj.bin || "Blue Bin (Recyclables)",
                                weight: `${finalWeight} kg`,
                                condition: plusCondition || "Good",
                                points: ptsEarned,
                                facility: "Elmina Central Park Eco Station",
                                status: "Logged",
                                time: "Just now",
                                createdAt: Date.now(),
                              };
                              setDisposedItems(prev => [newRecord, ...prev]);
                              setRecyclingPts(prev => prev + ptsEarned);
                              setTotalRecycledKg(prev => +(prev + finalWeight).toFixed(1));
                              setRecycleSessionCount(prev => prev + 1);

                              addRecycleSessionToDb({
                                residentName: userName || "Resident",
                                userEmail: epEmail || "resident@bingo.my",
                                stationName: "Elmina Central Park Eco Station",
                                materialType: `${plusCategory} - ${plusItemType}`,
                                weightKg: finalWeight,
                                pointsEarned: ptsEarned,
                              });
                              showUserToast(`Material logged! +${ptsEarned} Green Points awarded.`);
                              setPlusStep(5);
                            }}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Submit & Log Material →
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 5: NEXT ACTION (SUCCESS & COMPLETION) ══════════ */}
                  {plusStep === 5 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const ptsEarned = selectedCatObj.pts || 15;
                    return (
                      <div className="space-y-4 text-center py-2 pb-2">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                          <CheckCircle2 className="w-8 h-8 text-[#236B37]" strokeWidth={2.2} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">Material Classified & Logged!</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Your <strong className="text-emerald-800">{plusItemType}</strong> ({plusCategory}) has been logged.
                          </p>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full mt-2.5">
                            <span>🎁</span>
                            <span>+{ptsEarned} Green Points Added</span>
                          </div>
                        </div>

                        {/* Summary Details */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Classification:</span>
                            <span className="font-semibold text-slate-800">{selectedCatObj.bin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Condition:</span>
                            <span className="font-semibold text-slate-800">{plusCondition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Quantity / Weight:</span>
                            <span className="font-semibold text-slate-800">{plusWeight}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusModal(false);
                              setActiveTab("Map");
                            }}
                            className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Navigate to Eco Station</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPlusCategory("Plastic");
                                setPlusItemType("");
                                setPlusCondition("");
                                setPlusWeight("");
                                setCatBoxOpen(true);
                                setItemTypeBoxOpen(true);
                                setConditionBoxOpen(true);
                                setCatScrollProgress(0);
                                setPlusStep(1);
                              }}
                              className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                            >
                              Log Another Item
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Activity");
                                setActSection("Disposed Items");
                              }}
                              className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            >
                              Done / View Activity
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                  <h2 className="text-sm font-bold text-slate-900">{t("rep_title")} ({reportStep === 1 ? "Step 1/2" : "Step 2/2"})</h2>
                  <button onClick={resetReportModal} className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                  {reportStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">{t("rep_issue_type")}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Overflowing Bin", "Illegal Dumping", "Missed Collection", "Damaged Bin"].map(issue => (
                            <button
                              key={issue}
                              type="button"
                              onClick={() => {
                                setIssueType(issue);
                                if (!issueDesc.trim()) {
                                  if (issue === "Overflowing Bin") setIssueDesc("Public smart bin is overflowing and requires urgent clearing.");
                                  else if (issue === "Illegal Dumping") setIssueDesc("Unauthorized waste dumping observed along the roadside clearing.");
                                  else if (issue === "Missed Collection") setIssueDesc("Scheduled residential collection was missed for this area.");
                                  else if (issue === "Damaged Bin") setIssueDesc("Bin lid or sensor panel is physically damaged and needs repair.");
                                }
                              }}
                              className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                                issueType === issue
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {issue}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">{t("rep_desc")}</label>
                        <textarea
                          value={issueDesc}
                          onChange={e => setIssueDesc(e.target.value)}
                          placeholder={t("rep_desc_ph")}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!issueType}
                        onClick={() => {
                          if (!issueDesc.trim()) {
                            setIssueDesc(`Reported ${issueType} requiring municipal inspection.`);
                          }
                          setReportStep(2);
                        }}
                        className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mt-1 cursor-pointer ${
                          issueType
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {t("btn_next")} →
                      </button>
                    </div>
                  )}

                  {reportStep === 2 && (
                    <div className="space-y-3.5">
                      {/* Issue Summary Card */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">{issueType}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{issueDesc}</p>
                        </div>
                      </div>

                      {/* Location Input & GPS */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Incident Location</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={reportAddress || epArea || epZone || "City of Elmina, Shah Alam"}
                              onChange={e => setReportAddress(e.target.value)}
                              placeholder="Township or street location..."
                              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setGpsActive(true);
                              setReportAddress(epArea || epZone || "City of Elmina, Shah Alam");
                              showUserToast("GPS coordinates tagged successfully!");
                            }}
                            className={`px-3 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                              gpsActive
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                            }`}
                          >
                            {gpsActive ? "✓ Pinned" : "Pin GPS"}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-1">Tagging GPS helps municipal collectors reach the exact bin.</p>
                      </div>

                      {/* Photo Evidence Simulation */}
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Photo Proof Captured</p>
                            <p className="text-[10px] text-emerald-700 font-medium">✓ evidence_photo.jpg attached</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Ready</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReportStep(1)}
                          className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const finalAddress = (reportAddress || epArea || epZone || "City of Elmina, Shah Alam").trim();
                            const finalDesc = (issueDesc || `Reported ${issueType} requiring municipal attention.`).trim();
                            const newReport = {
                              id: Date.now(),
                              createdAt: Date.now(),
                              issue: issueType,
                              description: finalDesc,
                              address: finalAddress,
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
                            setActSection("Reports");
                            showUserToast("Report submitted successfully! Municipal team alerted.");
                          }}
                          className="flex-2 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          {t("btn_submit")}
                        </button>
                      </div>
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

        {/* ── Material Guide Details Modal ── */}
        <AnimatePresence>
          {selectedGuideItem && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
                onClick={() => setSelectedGuideItem(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[88%] z-10"
              >
                {/* Drag handle */}
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />

                {/* Modal Header */}
                <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-slate-50 rounded-xl border border-slate-100">
                      {selectedGuideItem.icon}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Material Details
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Official Sime Darby & City Municipal Guide
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideItem(null)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 overflow-y-auto space-y-4">
                  {/* Hero Item Overview */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          {selectedGuideItem.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {selectedGuideItem.name}
                        </h3>
                      </div>
                      <span className="text-3xl shrink-0 p-2 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
                        {selectedGuideItem.icon}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${selectedGuideItem.binBg} ${selectedGuideItem.binColor} ${selectedGuideItem.binText}`}>
                        {selectedGuideItem.bin}
                      </span>
                      {selectedGuideItem.points && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                          +{selectedGuideItem.points} pts/kg Green Points
                        </span>
                      )}
                    </div>

                    {selectedGuideItem.route && (
                      <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">Designated Facility:</span>
                          <span className="text-[11px] text-slate-500">{selectedGuideItem.route}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Official Sorting Rule */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Official Sorting Rule</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed pl-5">
                      {selectedGuideItem.rule}
                    </p>
                  </div>

                  {/* Preparation Steps */}
                  {selectedGuideItem.prepSteps && selectedGuideItem.prepSteps.length > 0 && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Preparation Steps Before Disposal</span>
                      </h4>
                      <div className="space-y-2.5">
                        {selectedGuideItem.prepSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {idx + 1}
                            </span>
                            <p className="leading-snug pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accepted vs Not Accepted */}
                  <div className="space-y-3">
                    {/* Accepted Items */}
                    {selectedGuideItem.accepted && selectedGuideItem.accepted.length > 0 && (
                      <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>What is Accepted</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700 pl-0.5">
                          {selectedGuideItem.accepted.map((acc, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{acc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Not Accepted Items */}
                    {selectedGuideItem.notAccepted && selectedGuideItem.notAccepted.length > 0 && (
                      <div className="bg-white border border-rose-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>What is NOT Accepted (Contaminants)</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700 pl-0.5">
                          {selectedGuideItem.notAccepted.map((no, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{no}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Pro Tip / Environmental Impact */}
                  {selectedGuideItem.tips && selectedGuideItem.tips.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-amber-900">Pro Recycling Tip</p>
                        <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                          {selectedGuideItem.tips.join(" ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedGuideItem(null)}
                      className="flex-1 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      Close Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const itm = selectedGuideItem;
                        setSelectedGuideItem(null);
                        setPlusCategory(
                          itm.category === "Organic" ? "Organic" :
                          itm.category === "Recyclables" ? "Plastic" :
                          itm.category
                        );
                        setPlusItemType(itm.name);
                        setPlusCondition("");
                        setPlusWeight("");
                        setPlusMode("manual");
                        setPlusStep(1);
                        setShowPlusModal(true);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all text-center cursor-pointer active:scale-95"
                    >
                      Dispose or Recycle →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
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
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  {t("logout_confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Set Collection Reminder Modal ── */}
        <AnimatePresence>
          {showReminderPicker && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setShowReminderPicker(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[85%] overflow-y-auto z-10 space-y-4"
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto" />
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Bell className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t("reminder_title")}</h3>
                      <p className="text-[11px] text-slate-500">{t("reminder_subtitle")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReminderPicker(false)}
                    className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Collection Info Card */}
                {(() => {
                  const nearest = [...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b)))[0];
                  const label = nearest ? `${nearest.day}, ${nearest.date} ${(nearest as any).month ?? ""} · ${nearest.time}` : "Upcoming Pickup";
                  const zone = nearest ? `${nearest.zone} — ${nearest.type}` : "Zone A – Scheduled Collection";
                  return (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <Recycle className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Next Waste Pickup</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{label}</p>
                        <p className="text-[11px] text-slate-600 truncate">{zone}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Reminder Interval Options */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Choose notification timing
                  </label>
                  {[
                    { id: "5m", label: t("reminder_5m"), desc: "Final call before truck reaches your street" },
                    { id: "30m", label: t("reminder_30m"), desc: "Time to roll bins out to the curb" },
                    { id: "1h", label: t("reminder_1h"), desc: "Recommended for morning sorting", recommended: true },
                    { id: "3h", label: t("reminder_3h"), desc: "Plenty of time to prepare recycling bundles" },
                    { id: "1d", label: t("reminder_1d"), desc: "Evening reminder the day before pickup" },
                    { id: "2d", label: t("reminder_2d"), desc: "Early advance notification for bulk sorting" },
                  ].map(opt => {
                    const isSelected = reminderSet && reminderChoice === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setReminderSet(true);
                          setReminderChoice(opt.label);
                          setShowReminderPicker(false);
                          showUserToast(`Reminder set for ${opt.label}!`);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600/30 shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50/80 text-slate-800 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                            <Clock className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-bold ${isSelected ? "text-emerald-950" : "text-slate-900"}`}>{opt.label}</p>
                              {opt.recommended && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{opt.desc}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" strokeWidth={2.2} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Remove Reminder Option if currently active */}
                {reminderSet && (
                  <button
                    type="button"
                    onClick={() => {
                      setReminderSet(false);
                      setReminderChoice("");
                      setShowReminderPicker(false);
                      showUserToast("Collection reminder removed.");
                    }}
                    className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BellOff className="w-4 h-4" />
                    <span>{t("reminder_remove")}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowReminderPicker(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t("btn_close")}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Interactive In-App Navigation Modal ── */}
        <AnimatePresence>
          {navigateLocation !== null && (() => {
            const loc = navigateLocation;
            const locLat = (loc as any).lat || 3.1868;
            const locLng = (loc as any).lng || 101.5042;
            const locAddr = (loc as any).address || (loc as any).township || "Sime Darby Property Township";
            const fc = fillColor(loc.fill);
            const steps: NavStep[] = (loc as any).navSteps || [
              { icon: "straight", label: `Head towards ${loc.name}`, road: locAddr, dist: loc.distance },
              { icon: "arrive", label: "Arrived at Destination", road: `${loc.name} on your right`, dist: "" },
            ];
            const currentStep = steps[Math.min(navStep, steps.length - 1)];
            const isLastStep = navStep >= steps.length - 1;
            const nextStep = !isLastStep ? steps[navStep + 1] : null;

            return (
              <div className="absolute inset-0 z-50 flex flex-col justify-end">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                  onClick={() => setNavigateLocation(null)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="relative bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[88%] overflow-y-auto z-10 flex flex-col"
                >
                  <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{loc.name}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{loc.distance} · {loc.township || "Selangor"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNavigateLocation(null)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── PHASE 1: SELECT TRANSPORT & ROUTE OVERVIEW ── */}
                  {navPhase === "select" && (
                    <div className="space-y-4 pt-3">
                      {/* Destination Details Card */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                            {loc.type || "Eco Station"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {loc.operatingHours || "Open Daily"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{locAddr}</p>

                        {/* Capacity Level */}
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                            <span>Bin Capacity</span>
                            <span className="font-bold tabular-nums" style={{ color: fc.dot }}>{loc.fill}% Full</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fc.bar}`} style={{ width: `${loc.fill}%` }} />
                          </div>
                        </div>

                        {/* Accepted Materials */}
                        {(loc as any).acceptedMaterials && (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {(loc as any).acceptedMaterials.map((mat: string) => (
                              <span key={mat} className="text-[10px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                                {mat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mode of Transport Selector */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                          Select Transport Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNavTransport("drive")}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              navTransport === "drive"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600/30 shadow-xs"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${navTransport === "drive" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Driving</p>
                              <p className="text-[10px] text-slate-500 font-medium">~{Math.max(2, Math.round(parseFloat(loc.distance) * 3 || 3))} mins</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNavTransport("walk")}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              navTransport === "walk"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600/30 shadow-xs"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${navTransport === "walk" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                              <Footprints className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Walking</p>
                              <p className="text-[10px] text-slate-500 font-medium">~{Math.max(5, Math.round(parseFloat(loc.distance) * 14 || 12))} mins</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNavPhase("active");
                            setNavStep(0);
                          }}
                          className="w-full py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Start Live Navigation</span>
                        </button>

                        <a
                          href={getGoogleMapsNavigationUrl(locLat, locLng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                        >
                          <ExternalLink className="w-4 h-4 text-emerald-700" />
                          <span>Open in External Google Maps</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ── PHASE 2: ACTIVE TURN-BY-TURN GUIDANCE ── */}
                  {navPhase === "active" && (
                    <div className="space-y-4 pt-3">
                      {/* High-visibility Maneuver Card */}
                      <div className="bg-gradient-to-br from-[#133E26] to-[#15803D] text-white rounded-3xl p-4 shadow-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                            {currentStep.icon === "left" ? (
                              <CornerUpLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
                            ) : currentStep.icon === "right" ? (
                              <CornerUpRight className="w-7 h-7 text-white" strokeWidth={2.5} />
                            ) : currentStep.icon === "arrive" ? (
                              <MapPin className="w-7 h-7 text-amber-300" strokeWidth={2.5} />
                            ) : (
                              <ArrowUp className="w-7 h-7 text-white" strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {currentStep.dist && (
                              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                                In {currentStep.dist}
                              </span>
                            )}
                            <h4 className="text-base font-extrabold tracking-tight leading-snug">
                              {currentStep.label}
                            </h4>
                            <p className="text-xs text-emerald-100/90 mt-0.5">
                              {currentStep.road}
                            </p>
                          </div>
                        </div>

                        {/* Next preview step */}
                        {nextStep && (
                          <div className="pt-2 border-t border-white/15 flex items-center gap-2 text-xs text-emerald-100">
                            <span className="text-[10px] uppercase font-bold text-emerald-200">Then:</span>
                            <span className="truncate">{nextStep.label}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress and Step Status */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Step {navStep + 1} of {steps.length}</span>
                          <span className="text-emerald-700 font-bold tabular-nums">
                            {Math.round(((navStep + 1) / steps.length) * 100)}% completed
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${((navStep + 1) / steps.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Navigation Action Buttons */}
                      <div className="space-y-2 pt-1">
                        {!isLastStep ? (
                          <button
                            type="button"
                            onClick={() => setNavStep(s => s + 1)}
                            className="w-full py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Next Step →</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNavPhase("arrived")}
                            className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                            <span>I Have Arrived!</span>
                          </button>
                        )}

                        <div className="flex gap-2">
                          <a
                            href={getGoogleMapsNavigationUrl(locLat, locLng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span>Google Maps</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => { setNavPhase("select"); setNavStep(0); }}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Exit Navigation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PHASE 3: ARRIVED AT STATION ── */}
                  {navPhase === "arrived" && (
                    <div className="space-y-4 pt-4 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                        <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                          Destination Reached
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-1">
                          You Have Arrived!
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 max-w-xs mx-auto">
                          {loc.name} is ready. Deposit your separated recyclables to earn green points.
                        </p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-medium">
                        🎁 Earn <strong className="text-emerald-800">+{loc.pointsPerKg || 15} Green Points</strong> per kilogram recycled today!
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNavigateLocation(null);
                            setShowPlusModal(true);
                            setPlusStep(0);
                            setPlusMode("");
                            setSelectedGuideItem(null);
                            setPlusGuideSearch("");
                            setPlusGuideCategory("All");
                          }}
                          className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Recycle className="w-4 h-4" />
                          <span>Log Recycled Items Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNavigateLocation(null)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Done / Back to Map
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* ── Global Interactive Toast ── */}
        <AnimatePresence>
          {userToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-14 left-4 right-4 z-60 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md border border-slate-700"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.2} />
              <span className="text-xs font-semibold flex-1 leading-snug">{userToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
