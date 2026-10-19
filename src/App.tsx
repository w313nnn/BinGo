import {createDemoAccount, DEMO_UID} from "./demoData";
import {setDemoSession} from "./demoSession";
import LanguageTransition from "./LanguageTransition";
import {useAppLanguage, currentLocale} from "./i18n";
import { L, localizeText } from "./i18n";
import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin, Calendar, AlertTriangle, Search, Bell, Navigation, Camera, Star, Trophy,
  ChevronRight, Truck, Recycle, Upload, Clock, CheckCircle, CheckCircle2, Leaf, User,
  Phone, ChevronLeft, Home, MessageSquare, X, Plus, Mail, LogOut, BookOpen, Key,
  CheckCheck, Filter, SlidersHorizontal, ArrowUp, ArrowRight, CornerUpLeft, CornerUpRight,
  Flag, CalendarDays, Shield, Pencil, Pin, PinOff, LayoutDashboard, FileText, Gift, Globe,
  BellOff, Car, Footprints, Trash2, ExternalLink, Info, Check, XCircle, Sparkles,
} from "lucide-react";
import SpecularButton from "./SpecularButton";
import usePageMotion from "./usePageMotion";
import ReminderDialog from "./ReminderDialog";
import Greeting from "./Greeting";
import RewardDetails from "./RewardDetails";
import CapacityIndicator from "./CapacityIndicator";
import LoginFlow from "./LoginFlow";
import BackButton from "./BackButton";
import AnimatedIcon from "./AnimatedIcon";
import useReachableStep from "./useReachableStep";
import FlowStepper from "./FlowStepper";
import PhotoInput from "./PhotoInput";
import { BIN_GO_CATEGORY_BY_LABEL, classifyWasteImage, type WastePrediction } from "./wasteClassifier";
import AnalysisMotion from "./AnalysisMotion";
import DetailsDisclosure from "./DetailsDisclosure";
const AdminPanel = lazy(() => import("./AdminPanel"));
import {
  recycleLocations, fillColor, matchesFilter, getCompassDir, calcETA, todayLabel,
  urgencyColors, statusColors, schedSortKey, PRESET_ACCOUNTS,
  getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, getReportTimeScore, getReportElapsedMinutes,
  MANUAL_CATEGORIES, CATEGORY_ITEM_TYPES, MANUAL_CONDITIONS,
} from "./appData";
import type { Report, LiveUpdate, Schedule, Reward, Notice, NavStep, UserAccount, DisposedItemRecord, PickupBooking } from "./appData";
import {
  resolveAdminAccess, submitFeedbackToDb, subscribeToReports, addReportToDb, updateReportStatusInDb,
  getUserProfileFromDb, subscribeToSchedules, subscribeToNotices, subscribeToLiveUpdates, subscribeToRewards, syncUserProfileToDb,
  subscribeToBinCapacities, updateBinCapacityInDb, type BinCapacityRecord,
  addRecycleSessionToDb, addPickupBookingToDb, addFeedbackToDb, subscribeToPickupBookingsForResident,
  subscribeToRecycleSessionsForResident, redeemRewardOnServer, redemptionServiceConfigured, getRedemptionsForResident, auth, googleProvider,
    checkLegacyRecordAgainstFirestore, type LegacyRecordCheckOutcome,
  } from "./firebase";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { isCapacityStale, mergeCapacityRecords, saveCapacityAndApplyConfirmed } from "./binCapacity";
const GoogleMapView = lazy(() => import("./GoogleMapView").then(module => ({default: module.GoogleMapView})));
import { SimeDarbyAddressPicker } from "./SimeDarbyAddressPicker";
import {
  SIME_DARBY_TOWNSHIPS,
  SIME_DARBY_COLLECTION_POINTS,
  getGoogleMapsNavigationUrl,
} from "./simeDarbyData";

const TABS = ["Home", "Map", "Activity", "Rewards", "Guide"] as const;
type Tab = (typeof TABS)[number];
type CollectionMethod = "self_drop_off" | "collector_pickup";
type BinLocation = (typeof recycleLocations)[number] & { capacityUpdatedAtMs?: number | null; capacityStale?: boolean };

interface PendingPickupBookingOperation {
  submissionId: string;
  authUid: string;
  booking: {
    residentName: string;
    residentEmail: string;
    recyclingSubmissionId: string;
    pickupAddress: string;
    pickupDate: string;
    pickupTime: string;
  };
  record: DisposedItemRecord & { pickupBookingConfirmed?: true };
  weightKg: number;
  mode: "ai" | "manual";
}

type ActivityDisposedItem = DisposedItemRecord & {
  pickupBooking?: PickupBooking;
  bookingOnly?: true;
};

function parsePositiveWeightKg(value: string): number | null {
  const trimmedValue = value.trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmedValue)) return null;
  const weightKg = Number(trimmedValue);
  return Number.isFinite(weightKg) && weightKg > 0 ? weightKg : null;
}

function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidRequestedPickupDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime())
    && getLocalDateInputValue(date) === value
    && value >= getLocalDateInputValue();
}

function isValidRequestedPickupTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60;
}

const SHOW_LEGACY_BROWSER_NOTICE = false;

function pickupReadWasDenied(error: unknown): boolean {
  return isFirestorePermissionDenied(error)
    && typeof error === "object" && error !== null
    && "phase" in error && error.phase === "get";
}

function isFirestorePermissionDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /permission-denied|missing or insufficient permissions/i.test(message);
}

const translations = {
  en: {
    nav_home:"Home", nav_map:"Map", nav_activity:"Activity", nav_rewards:"Rewards", nav_guide:"Guide",
    header_welcome:"BinGo", header_realtime:"Live Tracking",
    notif_title:"Notifications", notif_mark_read:"Mark all read", notif_empty:"No new notifications",
    btn_cancel:"Cancel", btn_confirm:"Confirm", btn_done:"Done", btn_back:"Back",
    btn_next:"Next", btn_submit:"Submit", btn_save:"Save Changes", btn_edit:"Edit",
    btn_close:"Close", btn_verify:"Verify & Confirm", btn_otp_cancel:"Cancel",
    status_pending:"Pending", status_in_action:"In Action", status_completed:"Completed", status_rejected:"Rejected",
    home_live:"Collection fleet", home_depot:"Depot", home_your_area:"Your Area",
    home_eta:"ETA", home_next_collection:"Next collection", home_set_reminder:"Set Reminder",
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
    rew_pts_available:"pts available", rew_all_unlocked:"Check point requirements",
    rew_eligible:"Eligible", rew_away:"more needed", rew_next:"Next reward:",
    rew_how_verified:"How Points Are Verified", rew_tap_expand:"tap to expand",
    rew_verified_credited:"Verified & Credited", rew_pending_verif:"Pending Verification",
    rew_pts_pending:"pending", rew_no_pts:"No verified points yet.",
    rew_pending_count:"pending verification",
    guide_title:"Sorting guide", guide_subtitle:"Find the right bin",
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
    plus_ai_title:"Camera Suggestion Assistant",
    plus_ai_desc:"Analyze your selected photo locally and review the suggested material.",
    plus_manual_title:"Manual Material Guide",
    plus_manual_desc:"Select material directly from our municipal classification rules",
    plus_step:"Step", plus_of:"of",
    plus_ai_s1:"Photo Capture", plus_ai_s2:"Visual Analysis",
    plus_ai_s3:"Review Details", plus_ai_s4:"Disposal Instructions",
    plus_ai_s5:"Management Review", plus_ai_s6:"Next Action",
    plus_man_s1:"Item Details", plus_man_s2:"Confirm Classification",
    plus_man_s3:"Disposal Path", plus_man_s4:"Management Review", plus_man_s5:"Next Action",
    plus_photo_ready:"Photo ready for AI analysis", plus_tap_change:"Tap to retake photo",
    plus_take_upload:"Take or Upload Item Photo",
    plus_ai_will:"The selected photo is analyzed locally in your browser",
    plus_simulate:"Simulate Camera Snap", plus_desc_opt:"Notes (optional)",
    plus_desc_ph:"e.g. Broken monitor, old lithium battery...",
    plus_analyse:"Analyze Photo →", plus_analysing:"Loading model and analyzing photo...",
    plus_ai_id:"WasteWise AI prediction",
    plus_ai_sug:"AI Material Prediction", plus_confidence:"% model score",
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
    prof_fb_privacy:"Please avoid including passwords or sensitive personal information in your feedback.",
    prof_fb_rating_required:"Please choose a rating from 1 to 5 stars.",
    prof_fb_error:"Feedback could not be sent. Your rating and comments are kept, so you can try again.",
    prof_fb_sending:"Sending...",
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
    notif_title:"Pemberitahuan", notif_mark_read:"Tanda semua dibaca", notif_empty:"Tiada pemberitahuan baharu",
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
    plus_ai_title:"Pembantu Cadangan Kamera",
    plus_ai_desc:"Aliran kamera simulasi ini tidak menganalisis kandungan imej. Pilih butiran bahan sendiri.",
    plus_manual_title:"Panduan Bahan Manual",
    plus_manual_desc:"Pilih bahan secara manual mengikut piawaian pengasingan majlis",
    plus_step:"Langkah", plus_of:"daripada",
    plus_ai_s1:"Rakam Foto", plus_ai_s2:"Analisis Visual",
    plus_ai_s3:"Semak Maklumat", plus_ai_s4:"Arahan Pelupusan",
    plus_ai_s5:"Semakan Pengurusan", plus_ai_s6:"Tindakan Lanjut",
    plus_man_s1:"Maklumat Barangan", plus_man_s2:"Pengesahan Bahan",
    plus_man_s3:"Laluan Pelupusan", plus_man_s4:"Semakan Pengurusan", plus_man_s5:"Tindakan Lanjut",
    plus_photo_ready:"Foto sedia untuk cadangan demo", plus_tap_change:"Tekan untuk tukar gambar",
    plus_take_upload:"Ambil atau Muat Naik Foto Barangan",
    plus_ai_will:"Demo ini menggunakan cadangan simulasi dan tidak mengelaskan imej dengan AI",
    plus_simulate:"Simulasi Ambil Gambar", plus_desc_opt:"Catatan Tambahan (pilihan)",
    plus_desc_ph:"cth. Skrin pecah, bateri lama...",
    plus_analyse:"Jana Cadangan Demo →", plus_analysing:"Menyediakan cadangan demo...",
    plus_ai_id:"Cadangan simulasi praset",
    plus_ai_sug:"Cadangan Pengenalan Simulasi", plus_confidence:"% skor demo",
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
    prof_fb_privacy:"Sila elakkan memasukkan kata laluan atau maklumat peribadi yang sensitif dalam maklum balas anda.",
    prof_fb_rating_required:"Sila pilih penilaian 1 hingga 5 bintang.",
    prof_fb_error:"Maklum balas tidak dapat dihantar. Penilaian dan komen anda disimpan, jadi anda boleh cuba lagi.",
    prof_fb_sending:"Menghantar...",
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

const GUIDE_MANUAL_MAPPINGS: Record<string, { category: string; itemTypes: string[] }> = {
  "pet-bottles": { category: "Plastic", itemTypes: ["Drink Bottles"] },
  "hdpe-plastics": { category: "Plastic", itemTypes: ["Hard Bottles"] },
  "aluminium-cans": { category: "Metal / Tin", itemTypes: ["Aluminium Beverage Cans"] },
  "cardboard-boxes": { category: "Paper / Cardboard", itemTypes: ["Cardboard Boxes"] },
  "newspapers-paper": {
    category: "Paper / Cardboard",
    itemTypes: ["Clean Paper & Books", "Newspapers & Magazines", "Office Paper"],
  },
  "glass-jars": { category: "Glass", itemTypes: ["Glass Beverage Bottles", "Food & Jam Jars"] },
  "food-scraps": { category: "Organic / Food", itemTypes: ["Food Scraps & Leftovers", "Eggshells", "Bakery & Crusts"] },
  "fruit-peels": { category: "Organic / Food", itemTypes: ["Fruit & Veg Peelings"] },
  "garden-leaves": { category: "Garden / Biomass", itemTypes: ["Garden Clippings", "Tree Branches", "Fallen Leaves", "Pruned Twigs", "Plant Soil"] },
  "smartphones-laptops": { category: "E-Waste", itemTypes: ["Smartphones & Tablets", "Laptops & Computers"] },
  batteries: { category: "E-Waste", itemTypes: ["Household Batteries", "Power Banks"] },
  "chargers-cables": { category: "E-Waste", itemTypes: ["Power Cables & Adapters", "Small Appliances"] },
  "soiled-packaging": { category: "General Waste", itemTypes: ["Soiled Food Wrappers", "Oily Pizza Boxes"] },
  "styrofoam-boxes": { category: "General Waste", itemTypes: ["Polystyrene Styrofoam"] },
  "broken-ceramics": { category: "General Waste", itemTypes: ["Broken Ceramics & Glassware"] },
  "bulky-furniture": { category: "Bulky / Furniture", itemTypes: ["Chairs & Tables", "Sofas & Couches", "Mattresses", "Wooden Wardrobes"] },
};

function resolveMaterialPointsPerKg(category: string, itemType: string) {
  const guideItem = MANUAL_GUIDE_ITEMS.find(item => {
    const mapping = GUIDE_MANUAL_MAPPINGS[item.id];
    return mapping?.category === category && mapping.itemTypes.includes(itemType);
  });
  const categoryPoints = MANUAL_CATEGORIES.find(item => item.name === category)?.pts;
  const points = guideItem?.points ?? categoryPoints;

  return typeof points === "number"
    ? { points, guideItem, usesCategoryRate: guideItem?.points === undefined }
    : undefined;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const demoModeRef = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Coursework demo admin: not Firebase-authorized, so protected Firestore data stays denied.
  const [localDemoAdmin, setLocalDemoAdmin] = useState(false);
  const localDemoAdminRef = useRef(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsError, setReportsError] = useState("");
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState("");
  const [binCapacities, setBinCapacities] = useState<Record<string, BinCapacityRecord>>({});
  const [binCapacityState, setBinCapacityState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [binCapacityError, setBinCapacityError] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const bins = recycleLocations.map(location => {
    const capacity = binCapacities[String(location.id)];
    const capacityStale = capacity ? isCapacityStale(capacity.updatedAtMs) : false;
    return {
      ...location,
      fill: capacity && !capacityStale ? capacity.fillPercentage : undefined,
      capacityUpdatedAtMs: capacity?.updatedAtMs,
      capacityStale,
    };
  });

  const saveBinCapacity = async (locationId: string, fillPercentage: number) => {
    await saveCapacityAndApplyConfirmed(
      () => updateBinCapacityInDb(locationId, fillPercentage),
      savedCapacity => setBinCapacities(current => ({ ...current, [locationId]: savedCapacity })),
    );
  };

  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const appContentRef = useRef<HTMLElement>(null);
  usePageMotion(appContentRef, `${activeTab}:${loggedIn}`);
  useEffect(() => { appContentRef.current?.scrollTo({ top: 0 }); }, [activeTab]);

  const [showProfile, setShowProfile] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const plusDialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPlusModal) return;
    const trigger = document.activeElement as HTMLElement | null;
    const sheet = plusDialogRef.current;
    sheet?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setShowPlusModal(false); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(sheet?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') || []).filter(control => control.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (!sheet?.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); trigger?.focus(); };
  }, [showPlusModal]);

  const [plusStep, setPlusStep] = useState(0);
  const [plusMode, setPlusMode] = useState<"ai" | "manual" | "">("");
  const [plusPhoto, setPlusPhoto] = useState(false);
  const [plusPhotoUrl, setPlusPhotoUrl] = useState<string>("");
  const [plusImageError, setPlusImageError] = useState("");
  const imageReadIdRef = useRef(0);
  const [plusSubmitting, setPlusSubmitting] = useState(false);
  const recycleSubmittingRef = useRef(false);
  const recycleSubmissionIdRef = useRef<string | null>(null);
  const pickupBookingOperationRef = useRef<PendingPickupBookingOperation | null>(null);
  const [pickupOperationStatus, setPickupOperationStatus] = useState<"idle" | "retry_booking" | "uncertain">("idle");
  const [plusDesc, setPlusDesc] = useState("");
  const [plusCategory, setPlusCategory] = useState("");
  const [plusItemType, setPlusItemType] = useState("");
  const [plusCondition, setPlusCondition] = useState("");
  const [plusWeight, setPlusWeight] = useState("");
  const [plusWeightError, setPlusWeightError] = useState("");
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>("self_drop_off");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupDetailsError, setPickupDetailsError] = useState("");
  const [plusAiLoading, setPlusAiLoading] = useState(false);
  useEffect(() => {
    if (!showPlusModal) { imageReadIdRef.current++; setPlusAiLoading(false); }
  }, [showPlusModal]);

  const [plusAiSuggestion, setPlusAiSuggestion] = useState<WastePrediction | null>(null);
  const [plusAiError, setPlusAiError] = useState("");
  const [plusSelectedRoute, setPlusSelectedRoute] = useState("");
  const [plusDetectedItem, setPlusDetectedItem] = useState("");
  const [plusDone, setPlusDone] = useState(false);
  const plusReachableStep = useReachableStep(plusStep, plusMode === "ai" ? 6 : 5, plusMode,
    JSON.stringify([plusPhotoUrl, plusCategory, plusItemType, plusCondition, plusWeight, plusDesc, plusSelectedRoute, collectionMethod, pickupAddress, pickupDate, pickupTime]), showPlusModal);

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
      if (saved) {
        const legacyRecords = JSON.parse(saved) as DisposedItemRecord[];
        return legacyRecords.map(item => {
          const validStatuses: DisposedItemRecord["status"][] = [
            "Completed", "Verified", "Logged", "Pending Verification", "Rejected", "Unknown",
          ];
          const status: DisposedItemRecord["status"] = validStatuses.includes(item.status)
            && (item.status === "Pending Verification" || item.status === "Logged")
            ? "Pending Verification"
            : "Unknown";
          const hasPendingPoints = typeof item.pointsPending === "number";

          return {
            ...item,
            source: "local_preview",
            verified: undefined,
            pointsApproved: undefined,
            localOwnerUid: typeof item.localOwnerUid === "string" ? item.localOwnerUid : undefined,
            points: 0,
            ...(hasPendingPoints ? {} : { pointsPending: undefined }),
            pointsClassification: hasPendingPoints ? "pending" : "unknown",
            ...(!hasPendingPoints && typeof item.points === "number" && item.points !== 0
              ? { pointsUnclassified: item.points }
              : {}),
            status,
          };
        });
      }
    } catch {}
    return [];
  });
  const [firebaseAuthState, setFirebaseAuthState] = useState<{ ready: boolean; uid: string | null; error: string }>({
    ready: false,
    uid: null,
    error: "",
  });
  const [pickupBookingsState, setPickupBookingsState] = useState<{
    uid: string | null;
    bookings: PickupBooking[];
    loading: boolean;
    error: string;
  }>({ uid: null, bookings: [], loading: false, error: "" });
  const [pickupBookingsReload, setPickupBookingsReload] = useState(0);
  const [recyclingHistoryState, setRecyclingHistoryState] = useState<{
    uid: string | null;
    records: DisposedItemRecord[];
    loading: boolean;
    error: string;
  }>({ uid: null, records: [], loading: false, error: "" });
  const [recyclingHistoryReload, setRecyclingHistoryReload] = useState(0);
  // TEMPORARY legacy-record comparison state (read-only investigation).
  const [legacyCheck, setLegacyCheck] = useState<{
    running: boolean;
    message: string;
    results: Record<string, LegacyRecordCheckOutcome>;
  }>({ running: false, message: "", results: {} });
  const runLegacyCheck = async (records: DisposedItemRecord[]) => {
    if (!auth.currentUser) {
      setLegacyCheck({ running: false, message: "Sign in with Firebase Authentication first. No requests were made.", results: {} });
      return;
    }
    const demoIds = new Set(["disp-1", "disp-2", "disp-3"]);
    const ids = records
      .map(record => record.id)
      .filter((id): id is string => typeof id === "string" && !demoIds.has(id));
    const skipped = records.length - ids.length;
    setLegacyCheck({ running: true, message: "", results: {} });
    const results: Record<string, LegacyRecordCheckOutcome> = {};
    for (const id of ids) {
      try {
        results[id] = await checkLegacyRecordAgainstFirestore(id);
      } catch {
        results[id] = "Check failed — unknown";
      }
    }
    setLegacyCheck({
      running: false,
      message: skipped > 0 ? `${skipped} record(s) skipped (demo or non-text IDs).` : "",
      results,
    });
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (demoModeRef.current) return;
      if (!user) {
        if (active) {
          setFirebaseAuthState({ ready: true, uid: null, error: "" });
          setRecyclingHistoryState({ uid: null, records: [], loading: false, error: "" });
          if (!localDemoAdminRef.current) {
            setLoggedIn(false);
            setIsAdmin(false);
          }
        }
        return;
      }
      try {
        const adminAccess = await resolveAdminAccess(user);
        if (user.email?.toLowerCase() === "admin123@bingo.com" && !adminAccess) throw new Error("Administrator access could not be verified.");
        if (active && !demoModeRef.current && auth.currentUser?.uid === user.uid) {
          setFirebaseAuthState({ ready: true, uid: user.uid, error: "" });
          setLoggedIn(true);
          setIsAdmin(adminAccess);
          setUserName(user.displayName || user.email?.split("@")[0] || "Resident");
          setEpEmail(user.email || ""); setEpPhone(user.phoneNumber || ""); setEpZone(""); setEpArea(""); setEpCollDay("");
          try {
            const profile = await getUserProfileFromDb();
            if (active && !demoModeRef.current && auth.currentUser?.uid === user.uid) {
              if (profile.name) setUserName(profile.name);
              setEpPhone(profile.phone || user.phoneNumber || ""); setEpZone(profile.zone); setEpArea(profile.area); setEpCollDay(profile.collectionDays);
            }
          } catch { if (active) showUserToast("Profile unavailable. Please try again later."); }
        }
      } catch (error) {
        console.error("Could not verify Firebase account claims:", error);
        if (active && !demoModeRef.current && auth.currentUser?.uid === user.uid) {
          setFirebaseAuthState({ ready: true, uid: user.uid, error: "Could not verify Firebase account claims." });
          setLoggedIn(false);
          setIsAdmin(false);
          setRecyclingHistoryState({ uid: user.uid, records: [], loading: false, error: "Could not verify Firebase account claims." });
        }
      }
    }, error => {
      console.error("Could not observe Firebase Authentication state:", error);
      if (active) {
        setFirebaseAuthState({
          ready: true,
          uid: null,
          error: "Could not determine your Firebase sign-in state. Protected data is unavailable.",
        });
        setLoggedIn(false);
        setIsAdmin(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (demoMode) {
      setRecyclingHistoryState({uid:DEMO_UID,records:createDemoAccount().records,loading:false,error:""});
      return;
    }
    const uid = firebaseAuthState.uid;
    if (!firebaseAuthState.ready || !uid) {
      setRecyclingHistoryState({ uid: null, records: [], loading: false, error: "" });
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    setRecyclingHistoryState({ uid, records: [], loading: true, error: "" });
    try {
      unsubscribe = subscribeToRecycleSessionsForResident(uid, records => {
        if (active && auth.currentUser?.uid === uid) {
          setRecyclingHistoryState({ uid, records, loading: false, error: "" });
        }
      }, error => {
        if (active && auth.currentUser?.uid === uid) {
          setRecyclingHistoryState({
            uid,
            records: [],
            loading: false,
            error: error.message || "Could not load recycling history.",
          });
        }
      });
    } catch (error) {
      console.error("Could not subscribe to resident recycling history:", error);
      setRecyclingHistoryState({
        uid,
        records: [],
        loading: false,
        error: error instanceof Error ? error.message : "Could not load recycling history.",
      });
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [firebaseAuthState.ready, firebaseAuthState.uid, recyclingHistoryReload, demoMode]);

  useEffect(() => {
    let active = true;
    if (demoMode) {
      setPickupBookingsState({uid:DEMO_UID,bookings:createDemoAccount().bookings,loading:false,error:""});
      return;
    }
    const uid = firebaseAuthState.uid;

    if (!firebaseAuthState.ready) return;
    if (!uid) {
      setPickupBookingsState({ uid: null, bookings: [], loading: false, error: "" });
      return;
    }

    setPickupBookingsState({ uid, bookings: [], loading: true, error: "" });
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToPickupBookingsForResident(uid, bookings => {
        if (active && auth.currentUser?.uid === uid) {
          setPickupBookingsState({ uid, bookings, loading: false, error: "" });
        }
      }, error => {
        if (active && auth.currentUser?.uid === uid) {
          setPickupBookingsState({
            uid,
            bookings: [],
            loading: false,
            error: error.message || "Could not load pickup bookings.",
          });
        }
      });
    } catch (error) {
      console.error("Could not subscribe to resident pickup bookings:", error);
      setPickupBookingsState({
        uid,
        bookings: [],
        loading: false,
        error: error instanceof Error ? error.message : "Could not load pickup bookings.",
      });
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [firebaseAuthState.ready, firebaseAuthState.uid, pickupBookingsReload, demoMode]);

  useEffect(() => {
    try {
      localStorage.setItem("bingo_disposed_items", JSON.stringify(disposedItems));
    } catch {}
  }, [disposedItems]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportModal, setReportModal] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const reportSubmittingRef = useRef(false);
  const [reportSubmitError, setReportSubmitError] = useState("");
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
  const [navigateLocation, setNavigateLocation] = useState<BinLocation | null>(null);
  const [navPhase, setNavPhase] = useState<"select"|"active"|"arrived">("select");
  const [navTransport, setNavTransport] = useState<"walk"|"drive">("drive");
  const [navStep, setNavStep] = useState(0);
  const [recyclingModal, setRecyclingModal] = useState(false);
  const [recyclingStep, setRecyclingStep] = useState(1);
  const [recyclingMaterial, setRecyclingMaterial] = useState("");
  const [recyclingKg, setRecyclingKg] = useState("");
  const [recyclingPhoto, setRecyclingPhoto] = useState(false);
  const [recyclingDone, setRecyclingDone] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState("All");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyTimeFilter, setHistoryTimeFilter] = useState("All");
  const [rewardDetail, setRewardDetail] = useState<Reward | null>(null);
  const [rewardsSubPage, setRewardsSubPage] = useState<"" | "redeem" | "history" | "eligibility">("");
  useEffect(() => { appContentRef.current?.scrollTo({ top: 0 }); }, [rewardsSubPage, rewardDetail?.id]);
  const [profileSubPage, setProfileSubPage] = useState<"" | "editProfile" | "phone" | "email" | "addresses" | "notifications" | "feedback" | "language" | "switchAccount" | "sharedData">("");
  const appLanguage = useAppLanguage();
  const t = (key: TKey): string => localizeText(translations.en[key]);
  const [langPending, setLangPending] = useState<"en" | "ms" | null>(null);
  const [showLangConfirm, setShowLangConfirm] = useState(false);
  const [showLangLoading, setShowLangLoading] = useState(false);
  const [profileOtpStep, setProfileOtpStep] = useState(false);
  const [profileOtpValue, setProfileOtpValue] = useState("");
  const [profileOtpError, setProfileOtpError] = useState("");
  const [profileOtpDone, setProfileOtpDone] = useState(false);
  const [epPhone, setEpPhone] = useState(() => {
    try { return localStorage.getItem("bingo_user_phone") || ""; } catch { return ""; }
  });
  const [epEmail, setEpEmail] = useState(() => {
    try { return localStorage.getItem("bingo_user_email") || ""; } catch { return ""; }
  });
  const [epZone, setEpZone] = useState(() => {
    try { return localStorage.getItem("bingo_user_zone") || ""; } catch { return ""; }
  });
  const [epArea, setEpArea] = useState(() => {
    try { return localStorage.getItem("bingo_user_area") || ""; } catch { return ""; }
  });
  const [epCollDay, setEpCollDay] = useState("");
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
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const feedbackLockRef = useRef(false);
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

  async function submitDisposedItem(input: {
    mode: "ai" | "manual";
    collectionMethod: CollectionMethod;
    pickupAddress: string;
    pickupDate: string;
    pickupTime: string;
    itemName: string;
    materialType: string;
    icon: string;
    bin: string;
  }) {
    if (demoMode) { showUserToast("Demo account: sample data only. Sign in to a real account to save changes."); return; }
    if (recycleSubmittingRef.current) return;
    const retryOperation = pickupBookingOperationRef.current;
    if (retryOperation) {
      if (pickupOperationStatus === "uncertain") {
        setPickupDetailsError("The recycling save could not be confirmed. It may already exist, so this flow will not resubmit it automatically. Keep this operation for support or verification.");
        return;
      }
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setPickupDetailsError("Sign in with Firebase Authentication to retry this pickup booking. Your saved recycling details are retained.");
        return;
      }
      if (currentUser.uid !== retryOperation.authUid) {
        setPickupDetailsError("Sign back in with the same Firebase account used for this request before retrying the pickup booking.");
        return;
      }

      recycleSubmittingRef.current = true;
      setPlusSubmitting(true);
      setPickupDetailsError("");
      try {
        await addPickupBookingToDb(retryOperation.submissionId, retryOperation.booking);
        completeDisposedItemSubmission(retryOperation, true);
      } catch (error) {
        console.error("Recycling item was saved, but pickup booking retry failed:", { submissionId: retryOperation.submissionId, errorCode: isFirestorePermissionDenied(error) ? "permission-denied" : "other" });
        setPickupDetailsError(isFirestorePermissionDenied(error)
          ? (pickupReadWasDenied(error)
            ? "Recycling is saved. Firestore denied the booking's initial read, before its write. Check the published pickupBookings get rule in the configured database, then retry; your details are retained."
            : "The recycling record is saved, but Firestore denied pickup creation. Check the published create rule and linked submission, then retry; your details are retained.")
          : "The recycling record is saved, but the pickup booking could not be confirmed. The booking may already exist; retry safely checks the same booking ID without resubmitting the recycling record.");
        showUserToast("Recycling saved, but the pickup booking is not confirmed. Your saved details are retained for a booking-only retry.");
      } finally {
        recycleSubmittingRef.current = false;
        setPlusSubmitting(false);
      }
      return;
    }
    if (pickupOperationStatus === "uncertain") {
      setPickupDetailsError("The recycling save could not be confirmed. It may already exist, so this flow will not resubmit it automatically. Keep this operation for support or verification.");
      return;
    }
    if (input.collectionMethod === "collector_pickup") {
      if (!input.pickupAddress.trim()
        || !isValidRequestedPickupDate(input.pickupDate)
        || !isValidRequestedPickupTime(input.pickupTime)) {
        setPickupDetailsError("Enter a pickup address and choose a valid pickup date and time.");
        setPlusStep(input.mode === "ai" ? 5 : 4);
        return;
      }
    }
    const authenticatedUser = input.collectionMethod === "collector_pickup" ? auth.currentUser : null;
    if (input.collectionMethod === "collector_pickup" && !authenticatedUser) {
      setPickupDetailsError("Sign in with Firebase Authentication before requesting a collector pickup.");
      showUserToast("A Firebase-authenticated resident account is required to request a pickup.");
      return;
    }
    setPickupDetailsError("");
    const finalWeight = parsePositiveWeightKg(plusWeight);
    if (finalWeight === null) {
      setPlusWeightError("Enter a positive weight in kg using numbers only (for example, 3.5).");
      setPlusStep(input.mode === "ai" ? 3 : 1);
      return;
    }
    const category = plusCategory || "Plastic";
    const itemType = plusItemType || (input.mode === "manual" ? plusDetectedItem : "");
    if (!itemType.trim()) {
      setPlusWeightError("Choose the specific item type before continuing.");
      setPlusStep(input.mode === "ai" ? 3 : 1);
      return;
    }
    const pointRate = resolveMaterialPointsPerKg(category, itemType);
    if (!pointRate) {
      setPlusWeightError(`No points-per-kg rate is defined for ${itemType} (${category}). Contact an administrator before submitting.`);
      setPlusStep(input.mode === "ai" ? 3 : 1);
      return;
    }
    const pendingPoints = Math.floor(pointRate.points * finalWeight);
    if (!Number.isFinite(pendingPoints) || !Number.isInteger(pendingPoints) || pendingPoints < 0) {
      setPlusWeightError("The weight is too large to calculate pending points. Enter a smaller weight in kg.");
      setPlusStep(input.mode === "ai" ? 3 : 1);
      return;
    }
    setPlusWeightError("");
    recycleSubmittingRef.current = true;
    setPlusSubmitting(true);
    try {
      if (!recycleSubmissionIdRef.current) {
        recycleSubmissionIdRef.current = crypto.randomUUID();
      }
      const submissionId = recycleSubmissionIdRef.current;
      if (!submissionId) throw new Error("Missing recycling submission ID.");

      const condition = plusCondition || (input.mode === "ai" ? "Good" : "Clean & Empty");
      // The resident chooses and confirms the final material details in the next step.
      const identificationMode = "manual" as const;
      const session = {
        submissionId,
        residentName: userName || "Resident",
        userEmail: epEmail || "resident@bingo.my",
        stationName: "Elmina Central Park Eco Station",
        materialType: input.materialType,
        category,
        itemName: input.itemName,
        itemType,
        condition,
        icon: input.icon,
        bin: input.bin,
        weightKg: finalWeight,
        pointsPending: pendingPoints,
        collectionMethod: input.collectionMethod,
        identificationMode,
        ...(input.mode === "ai" && plusAiSuggestion ? {
          detectedItem: plusDetectedItem,
          confidence: plusAiSuggestion.score,
          suggestedRoute: plusSelectedRoute || "Recycling Drop-off",
        } : {}),
        photoAttached: input.mode === "ai" && plusPhoto,
      } as const;

      const newRecord: PendingPickupBookingOperation["record"] = {
        id: submissionId,
        source: "local_preview",
        ...(authenticatedUser?.uid ? { localOwnerUid: authenticatedUser.uid } : {}),
        itemName: input.itemName,
        category,
        itemType,
        icon: input.icon,
        bin: input.bin,
        weight: `${finalWeight} kg`,
        condition,
        points: 0,
        pointsPending: pendingPoints,
        pointsClassification: "pending",
        facility: "Elmina Central Park Eco Station",
        status: "Logged",
        time: "Just now",
        createdAt: Date.now(),
        identificationMode,
        ...(input.mode === "ai" && plusAiSuggestion ? {
          detectedItem: plusDetectedItem,
          confidence: plusAiSuggestion.score,
          photoAttached: plusPhoto,
        } : {}),
        collectionMethod: input.collectionMethod,
        ...(input.collectionMethod === "collector_pickup" ? {
          pickupAddress: input.pickupAddress.trim(),
          pickupDate: input.pickupDate,
          pickupTime: input.pickupTime,
          pickupRequestStatus: "Requested" as const,
          pickupBookingConfirmed: true as const,
        } : {}),
      };

      const operation: PendingPickupBookingOperation = {
        submissionId,
        authUid: authenticatedUser?.uid || "",
        booking: {
          residentName: userName || "Resident",
          residentEmail: authenticatedUser?.email || epEmail,
          recyclingSubmissionId: submissionId,
          pickupAddress: input.pickupAddress.trim(),
          pickupDate: input.pickupDate,
          pickupTime: input.pickupTime,
        },
        record: newRecord,
        weightKg: finalWeight,
        mode: input.mode,
      };
      if (input.collectionMethod === "collector_pickup") {
        pickupBookingOperationRef.current = operation;
      }

      try {
        await addRecycleSessionToDb(session);
      } catch (error) {
        console.error("Could not save recycling submission:", error);
        if (input.collectionMethod === "collector_pickup" && !isFirestorePermissionDenied(error)) {
          setPickupOperationStatus("uncertain");
          setPickupDetailsError("The recycling save could not be confirmed. It may already have been saved, and no pickup booking is confirmed. To avoid overwriting or duplicating it, this flow will not automatically resubmit the recycling record.");
          showUserToast("The recycling save is uncertain; no pickup booking is confirmed. The form is paused to prevent a duplicate.");
        } else {
          pickupBookingOperationRef.current = null;
          setPickupDetailsError(isFirestorePermissionDenied(error)
            ? "Firestore denied the recycling submission, so no pickup booking was created. Check Firebase Authentication and recycling-session permissions, then retry."
            : "");
          showUserToast(isFirestorePermissionDenied(error)
            ? "Firestore denied the recycling submission. No pickup booking was created."
            : "Could not save your disposal submission. Your details are still here; please try again.");
        }
        return;
      }

      if (input.collectionMethod === "collector_pickup") {
        setPickupOperationStatus("retry_booking");
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.uid !== operation.authUid) {
          setPickupDetailsError("Your recycling record is saved, but the pickup booking is not confirmed. Sign in with the same Firebase account to retry; your request details are retained.");
          showUserToast("Recycling saved, but the pickup booking is not confirmed. Sign in with the same account to retry.");
          return;
        }
        try {
          await addPickupBookingToDb(submissionId, operation.booking);
          completeDisposedItemSubmission(operation, true);
        } catch (error) {
          console.error("Recycling item was saved, but pickup booking creation failed:", { submissionId, errorCode: isFirestorePermissionDenied(error) ? "permission-denied" : "other" });
          setPickupDetailsError(isFirestorePermissionDenied(error)
            ? (pickupReadWasDenied(error)
              ? "Recycling is saved. Firestore denied the booking's initial read, before its write. Check the published pickupBookings get rule in the configured database, then retry; your details are retained."
              : "Your recycling record is saved, but Firestore denied pickup creation. Check the published create rule and linked submission, then retry; your details are retained.")
            : "Your recycling record is saved, but the pickup booking could not be confirmed. The booking may already exist; retry safely checks the same booking ID without resubmitting the recycling record.");
          showUserToast("Recycling saved, but the pickup booking is not confirmed. Your saved details are retained for a booking-only retry.");
        }
      } else {
        completeDisposedItemSubmission(operation, false);
      }
    } catch (error) {
      console.error("Could not save recycling submission:", error);
      showUserToast(isFirestorePermissionDenied(error)
        ? "Firestore denied the recycling submission. Please check your account permissions."
        : "Could not save your disposal submission. Your details are still here; please try again.");
    } finally {
      recycleSubmittingRef.current = false;
      setPlusSubmitting(false);
    }
  }

  function completeDisposedItemSubmission(operation: PendingPickupBookingOperation, hasPickupBooking: boolean) {
    setDisposedItems(prev => [operation.record, ...prev.filter(item => item.id !== operation.submissionId)]);
    if (hasPickupBooking) setPickupBookingsReload(value => value + 1);
    showUserToast(hasPickupBooking
      ? "Recycling submission saved and pickup booking requested. Recycling verification and points approval are still pending."
      : "Disposal submission saved and is pending verification.");
    setPlusStep(operation.mode === "ai" ? 6 : 5);
    recycleSubmissionIdRef.current = null;
    pickupBookingOperationRef.current = null;
    setPickupOperationStatus("idle");
    setPickupDetailsError("");
  }

  function reopenPendingPickupBooking(): boolean {
    const operation = pickupBookingOperationRef.current;
    if (!operation) return false;
    setCollectionMethod("collector_pickup");
    setPickupAddress(operation.booking.pickupAddress);
    setPickupDate(operation.booking.pickupDate);
    setPickupTime(operation.booking.pickupTime);
    setPlusMode(operation.mode);
    setPlusStep(operation.mode === "ai" ? 5 : 4);
    setPlusCategory(operation.record.category);
    setPlusItemType(operation.record.itemType || operation.record.itemName);
    setPlusCondition(operation.record.condition);
    setPlusWeight(String(operation.weightKg));
    setPlusDetectedItem(operation.record.detectedItem || "");
    setPlusPhoto(operation.record.photoAttached || false);
    setShowPlusModal(true);
    return true;
  }

  function closeDisposalModal() {
    if (recycleSubmittingRef.current) return;
    if (pickupBookingOperationRef.current) {
      const confirmed = window.confirm(
        "This pickup operation is still unresolved. Closing will keep its details in this session so you can resume it later; it will not cancel any booking that may already exist. Continue?",
      );
      if (!confirmed) return;
      setShowPlusModal(false);
      return;
    }
    recycleSubmissionIdRef.current = null;
    setShowPlusModal(false);
  }

  function resetCollectionSelection() {
    setCollectionMethod("self_drop_off");
    setPickupAddress("");
    setPickupDate("");
    setPickupTime("");
    setPickupDetailsError("");
  }

  function clearCameraSuggestion() {
    setPlusAiSuggestion(null);
    setPlusDetectedItem("");
    setPlusAiError("");
    setPlusCategory("");
    setPlusItemType("");
    setPlusCondition("");
    setPlusSelectedRoute("");
    setPlusAiLoading(false);
  }

  async function analyzeCameraPhoto() {
    if (!plusPhotoUrl || plusAiLoading) return;
    const requestId = ++imageReadIdRef.current;
    setPlusAiLoading(true);
    setPlusAiError("");
    setPlusAiSuggestion(null);
    setPlusDetectedItem("");
    try {
      const prediction = await classifyWasteImage(plusPhotoUrl);
      if (requestId !== imageReadIdRef.current) return;
      setPlusAiSuggestion(prediction);
      setPlusDetectedItem(prediction.label);
    } catch (error) {
      if (requestId !== imageReadIdRef.current) return;
      setPlusAiSuggestion(null);
      setPlusDetectedItem("");
      setPlusAiError(error instanceof Error ? error.message : "Waste recognition failed. Retry or continue manually.");
    } finally {
      if (requestId === imageReadIdRef.current) setPlusAiLoading(false);
    }
  }

  async function submitFeedback() {
    if (feedbackLockRef.current) return;
    if (!Number.isInteger(feedbackRating) || feedbackRating < 1 || feedbackRating > 5) {
      setFeedbackError(t("prof_fb_rating_required"));
      return;
    }
    feedbackLockRef.current = true;
    setFeedbackSubmitting(true);
    setFeedbackError("");
    try {
      await addFeedbackToDb({ name: userName, rating: feedbackRating, text: feedbackText });
      setFeedbackSent(true);
    } catch (error) {
      console.error("Feedback was not saved:", { errorCode: (error as { code?: string }).code ?? "other" });
      setFeedbackError(t("prof_fb_error"));
    } finally {
      feedbackLockRef.current = false;
      setFeedbackSubmitting(false);
    }
  }

  function closeFeedback() {
    setProfileSubPage("");
    setFeedbackRating(0);
    setFeedbackText("");
    setFeedbackError("");
    setFeedbackSent(false);
  }

  function switchAccount(acc: UserAccount) {
    const authenticatedUid = auth.currentUser?.uid;
    if (!authenticatedUid || (acc.id !== authenticatedUid && acc.id !== `google_${authenticatedUid}`)) {
      showUserToast("Saved account details cannot sign you in. Sign out and authenticate with that account first.");
      return;
    }
    // Profile details come from Firestore for this UID, never from the saved device record,
    // and nothing is written back here so existing profile fields cannot be overwritten.
    setUserName(acc.name);
    setEpEmail(auth.currentUser?.email || acc.email);
    setEpPhone(auth.currentUser?.phoneNumber || "");
    setEpZone(""); setEpArea(""); setEpCollDay("");
    setProfileSubPage("");
    showUserToast(`Switched account to ${acc.name}`);
    void getUserProfileFromDb().then(profile => {
      if (auth.currentUser?.uid !== authenticatedUid) return;
      const name = profile.name || acc.name;
      const phone = profile.phone || auth.currentUser?.phoneNumber || "";
      setUserName(name);
      setEpPhone(phone); setEpZone(profile.zone); setEpArea(profile.area); setEpCollDay(profile.collectionDays);
      try {
        localStorage.setItem("bingo_username", name);
        localStorage.setItem("bingo_user_email", auth.currentUser?.email || "");
        localStorage.setItem("bingo_user_zone", profile.zone);
        localStorage.setItem("bingo_user_area", profile.area);
        localStorage.setItem("bingo_user_phone", phone);
      } catch {}
    }).catch(() => {
      if (auth.currentUser?.uid === authenticatedUid) showUserToast("Profile unavailable. Please try again later.");
    });
  }

  async function handleAddGoogleAccount() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const u = res.user;
        const name = u.displayName || u.email?.split("@")[0] || "Resident";
        const email = u.email || "";
        const phone = u.phoneNumber || "";
        const photoURL = u.photoURL || undefined;

        const newAcc: UserAccount = {
          id: u.uid || `google_${Date.now()}`,
          name,
          email,
          avatar: name.charAt(0).toUpperCase() || "G",
          bg: "bg-emerald-600 text-white",
          zone: "",
          area: "",
          phone,
          collectionDays: "",
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

  // Shared real-time bin capacity source for resident and administrator views.
  useEffect(() => {
    setBinCapacities({});
    setBinCapacityError("");
    if (!firebaseAuthState.ready) {
      setBinCapacityState("loading");
      return;
    }
    if (demoMode || !firebaseAuthState.uid) {
      setBinCapacityState("unavailable");
      return;
    }
    setBinCapacityState("loading");
    let active = true;
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToBinCapacities(records => {
        if (!active) return;
        setBinCapacities(current => mergeCapacityRecords(current, records));
        setBinCapacityState("ready");
        setBinCapacityError("");
      }, error => {
        if (!active) return;
        setBinCapacities({});
        setBinCapacityState("unavailable");
        setBinCapacityError((error as { code?: string }).code === "permission-denied"
          ? "Capacity data is unavailable because Firestore denied access."
          : "Could not load bin capacity. Check your connection and try again.");
      });
    } catch (error) {
      setBinCapacityState("unavailable");
      setBinCapacityError(error instanceof Error ? error.message : "Could not load bin capacity.");
    }
    return () => { active = false; unsubscribe(); };
  }, [firebaseAuthState.ready, firebaseAuthState.uid, demoMode]);

  // Real-time Firestore subscriptions for municipal data
  useEffect(() => {
    if (demoMode) {
      const data=createDemoAccount();
      setReports(data.reports); setReportsError(""); setSchedules(data.schedules); setNotices(data.notices); setLiveUpdates(data.fleet); setRewards(data.rewards); setRewardsLoading(false); setRewardsError("");
      return;
    }
    let unsubReports = () => {};
    let reportsActive = true;
    const reportsUid = firebaseAuthState.uid;
    // Clear the previous user's reports immediately so they are never shown to a new user
    setReports([]);
    setReportsError("");
    // Admins (real or local demo) ask Firestore for all reports and let the Firestore rules decide;
    // residents are always scoped to their own uid.
    if (firebaseAuthState.ready && (reportsUid || isAdmin)) {
      try {
        unsubReports = subscribeToReports(data => {
          if (reportsActive && (!reportsUid || auth.currentUser?.uid === reportsUid)) setReports(data);
        }, isAdmin ? undefined : reportsUid ?? undefined, error => {
          console.error("Could not load authorized reports:", error);
          if (!reportsActive) return;
          const code = (error as { code?: string }).code;
          setReports([]);
          setReportsError(code === "permission-denied"
            ? isAdmin
              ? "Could not load reports: Firestore denied the read (permission-denied). Reading all reports needs a real Firebase admin account (admin claim) or rules that allow it; the local demo login cannot authorize this."
              : "Could not load reports: Firestore denied the read (permission-denied). The deployed Firestore rules must allow residents to read reports where authorUid matches their account."
            : `Could not load reports for this Firebase account${code ? ` (${code})` : ""}.`);
        });
      } catch (error) {
        console.error("Could not subscribe to authorized reports:", error);
        setReportsError(error instanceof Error ? error.message : "Could not load reports.");
      }
    } else {
      setReports([]);
      if (firebaseAuthState.ready) {
        setReportsError(localDemoAdmin
          ? "Reports are unavailable: the local demo admin is not a Firebase-authenticated admin, so protected Firestore data cannot be read."
          : "Sign in with a Firebase Authentication account to load your saved reports. No data has been loaded yet.");
      }
    }
    const unsubSched = subscribeToSchedules((data) => {
      setSchedules(data);
    });
    const unsubNotices = subscribeToNotices((data) => {
      setNotices(data);
    });
    const unsubLiveUpdates = subscribeToLiveUpdates((data) => {
      setLiveUpdates(data);
    });
    const unsubRewards = subscribeToRewards((data) => {
      setRewards(data);
      setRewardsError("");
      setRewardsLoading(false);
    }, (error) => {
      console.error("Rewards subscription error:", error);
      setRewardsError("Could not load the rewards catalogue. Please try again later.");
      setRewardsLoading(false);
    });
    return () => {
      reportsActive = false;
      unsubReports();
      unsubSched();
      unsubNotices();
      unsubLiveUpdates();
      unsubRewards();
    };
  }, [firebaseAuthState.ready, firebaseAuthState.uid, isAdmin, localDemoAdmin, demoMode]);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuota);
  }, []);

  const [showMyRewards, setShowMyRewards] = useState(false);
  type RedeemedItem = { uid: string | number; firestoreId?: string; id: number; name: string; icon: string; category: string; points: number; expiresAt: string; code: string };
  const [myRedeemedList, setMyRedeemedList] = useState<RedeemedItem[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState("");
  const [redeemingRewards, setRedeemingRewards] = useState<Set<string>>(() => new Set());
  const redemptionLocksRef = useRef<Set<string>>(new Set());
  const redemptionRequestIdsRef = useRef<Map<string, string>>(new Map());
  const [redemptionsReload, setRedemptionsReload] = useState(0);
  const [redemptionsLoaded, setRedemptionsLoaded] = useState<{ uid: string; spentPoints: number } | null>(null);
  const [qrReward, setQrReward] = useState<RedeemedItem | null>(null);

  useEffect(() => {
    setQrReward(null);
    redemptionLocksRef.current.clear();
    redemptionRequestIdsRef.current.clear();
    setRedeemingRewards(new Set());
  }, [firebaseAuthState.uid]);

  useEffect(() => {
    if (demoMode) {
      setRedemptionsLoaded({uid:DEMO_UID,spentPoints:100}); setRedemptionsLoading(false); setRedemptionsError("");
      setMyRedeemedList([{uid:"demo-voucher",id:2,name:"Eco Tote Bag",icon:"🛍️",category:"Merchandise",points:100,expiresAt:new Date(Date.now()+7*86400000).toISOString(),code:"DEMO-NOT-VALID"}]);
      return;
    }
    const uid = firebaseAuthState.uid;
    if (!firebaseAuthState.ready || !uid) {
      setMyRedeemedList([]);
      setRedemptionsLoaded(null);
      setRedemptionsLoading(false);
      setRedemptionsError("");
      return;
    }
    let active = true;
    setRedemptionsLoading(true);
    setRedemptionsError("");
    void getRedemptionsForResident(uid).then(records => {
      if (active && auth.currentUser?.uid === uid) {
        setRedemptionsLoaded({
          uid,
          spentPoints: records.reduce((sum, record) => (record.status === "Cancelled" ? sum : sum + record.pointsCost), 0),
        });
        setMyRedeemedList(records.map(record => {
          const reward = rewards.find(item => item.name === record.rewardName);
          return {
            uid: record.id,
            firestoreId: record.id,
            id: reward?.id ?? 0,
            name: record.rewardName,
            icon: reward?.icon ?? "🎁",
            category: reward?.category ?? "Reward",
            points: record.pointsCost,
            expiresAt: record.expiresAt,
            code: record.voucherCode,
          };
        }));
      }
    }).catch(error => {
      console.error("Could not load resident redemption history:", error);
      if (active) {
        setRedemptionsLoaded(null);
        setRedemptionsError(error instanceof Error ? error.message : "Could not load redemption history.");
      }
    }).finally(() => {
      if (active) setRedemptionsLoading(false);
    });
    return () => { active = false; };
  }, [firebaseAuthState.ready, firebaseAuthState.uid, rewards, redemptionsReload, demoMode]);

  const resetReportModal = () => {
    if (reportSubmittingRef.current) return;
    setReportModal(false);
    setReportStep(1);
    setReportSubmitError("");
    setIssueType("");
    setIssueDesc("");
    setReportAddress("");
    setUrgency("");
    setReportPhotos([]);
    setGpsActive(false);
    setGpsError(false);
    setShowGpsDialog(false);
  };

  const authenticatedUid = firebaseAuthState.uid;
  const residentRecyclingRecords = authenticatedUid && recyclingHistoryState.uid === authenticatedUid
    ? recyclingHistoryState.records
    : [];
  const residentLocalPreviews = authenticatedUid
    ? disposedItems.filter(item => item.source !== "firestore" && item.localOwnerUid === authenticatedUid)
    : [];
  const mergedActivityById = new Map<string, ActivityDisposedItem>();
  for (const item of residentLocalPreviews) mergedActivityById.set(String(item.id), item);
  for (const item of residentRecyclingRecords) mergedActivityById.set(String(item.id), item);
  const activityItems = [...mergedActivityById.values()].sort((a, b) => b.createdAt - a.createdAt);
  const recyclingDataReady = Boolean(authenticatedUid
    && recyclingHistoryState.uid === authenticatedUid
    && !recyclingHistoryState.loading
    && !recyclingHistoryState.error);
  const userPoints = recyclingDataReady
    ? residentRecyclingRecords.reduce((sum, record) => (
      record.verified === true
      && record.status !== "Rejected"
      && typeof record.pointsApproved === "number"
      && Number.isFinite(record.pointsApproved)
      && record.pointsApproved >= 0
        ? sum + record.pointsApproved
        : sum
    ), 0)
    : 0;
  const redemptionServiceReady = !demoMode && redemptionServiceConfigured;
  // Balance = admin-approved points minus points already spent. Shown only when both
  // sources loaded for this account, so a failed load never looks like a real balance.
  const pointsBalanceReady = recyclingDataReady
    && redemptionsLoaded !== null
    && redemptionsLoaded.uid === authenticatedUid
    && !redemptionsError;
  const availablePoints = pointsBalanceReady && redemptionsLoaded
    ? Math.max(0, userPoints - redemptionsLoaded.spentPoints)
    : 0;
  const totalReports = reports.length;
  const collectedCount = authenticatedUid
    && pickupBookingsState.uid === authenticatedUid
    && !pickupBookingsState.loading
    && !pickupBookingsState.error
    ? pickupBookingsState.bookings.filter(booking => booking.status === "Collected").length
    : null;
  const recycledKg = recyclingDataReady
    ? Number(residentRecyclingRecords.reduce((sum, record) => {
      if (record.verified !== true || record.status === "Rejected") return sum;
      const weightKg = Number(record.weight.replace(/\s*kg$/i, "").trim());
      return Number.isFinite(weightKg) && weightKg > 0 ? sum + weightKg : sum;
    }, 0).toFixed(1))
    : null;


  async function redeemDetailedReward(r: Reward) {
    const rewardKey = r.firestoreId ?? String(r.id);
    const canRedeem = redemptionServiceReady && pointsBalanceReady && Boolean(r.firestoreId)
      && !r.banned && r.redeemed < r.maxRedemptions && availablePoints >= r.points;

                              if (!canRedeem || !r.firestoreId) return;
                              if (redemptionLocksRef.current.has(rewardKey)) return;
                              redemptionLocksRef.current.add(rewardKey);
                              setRedeemingRewards(new Set(redemptionLocksRef.current));
                              // The same request ID is reused if the result was uncertain, so a retry
                              // cannot spend points twice.
                              let requestId = redemptionRequestIdsRef.current.get(rewardKey);
                              if (!requestId) {
                                requestId = crypto.randomUUID();
                                redemptionRequestIdsRef.current.set(rewardKey, requestId);
                              }
                              try {
                                const result = await redeemRewardOnServer(r.firestoreId, requestId);
                                redemptionRequestIdsRef.current.delete(rewardKey);
                                const redeemedItem: RedeemedItem = {
                                  uid: result.redemptionId,
                                  firestoreId: result.redemptionId,
                                  id: r.id,
                                  name: result.rewardName,
                                  icon: r.icon,
                                  category: r.category,
                                  points: result.pointsCost,
                                  expiresAt: result.expiresAt,
                                  code: result.voucherCode,
                                };
                                setQrReward(redeemedItem);
                                setRedemptionsReload(value => value + 1);
                                showUserToast(result.alreadyProcessed
                                  ? `${result.rewardName} was already redeemed. Your voucher is shown.`
                                  : `Redeemed ${result.rewardName}! ${result.pointsCost} points deducted.`);
                              } catch (error) {
                                console.error("Could not redeem reward:", error);
                                const code = (error as { code?: string })?.code ?? "";
                                const definitive = ["functions/failed-precondition", "functions/not-found", "functions/invalid-argument", "functions/permission-denied", "functions/unauthenticated"].includes(code);
                                if (definitive) redemptionRequestIdsRef.current.delete(rewardKey);
                                setRedemptionsReload(value => value + 1);
                                const message = error instanceof Error ? error.message : "";
                                showUserToast(definitive && message
                                  ? message
                                  : code === "functions/not-found" || code === "functions/unavailable"
                                    ? "The redemption service is not reachable. No points were deducted that we can confirm; check your history before trying again."
                                    : "We could not confirm this redemption. Check your redemption history before trying again.");
                              } finally {
                                redemptionLocksRef.current.delete(rewardKey);
                                setRedeemingRewards(new Set(redemptionLocksRef.current));
                              }

  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-200/80 flex items-center justify-center sm:p-4">
        <LoginFlow onDemo={async () => {
          demoModeRef.current=true;
          try { await signOut(auth); } catch { demoModeRef.current=false; return; }
          setDemoSession(true); setDemoMode(true); setIsAdmin(false); setLocalDemoAdmin(false);
          const data=createDemoAccount();
          setFirebaseAuthState({ready:true,uid:DEMO_UID,error:""});
          setUserName(data.profile.name); setEpEmail(data.profile.email); setEpPhone(data.profile.phone); setEpZone(data.profile.zone); setEpArea(data.profile.area); setEpCollDay(data.profile.collectionDays);
          setReminderSet(true); setReminderChoice(translations.en.reminder_1h); setActiveTab("Home"); setLoggedIn(true);
        }} onDone={(admin, displayName) => {
          if (!auth.currentUser) {
            console.error("Login flow completed without a Firebase-authenticated user.");
            return;
          }
          setDemoSession(false); demoModeRef.current=false; setDemoMode(false);
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
      <div className="app-viewport bg-slate-200/80 flex items-center justify-center sm:p-4 relative">
        <Suspense fallback={<div role="status" className="startup-screen"><L>{"Loading control panel..."}</L></div>}><AdminPanel
          reports={reports} setReports={setReports}
          liveUpdates={liveUpdates} setLiveUpdates={setLiveUpdates}
          schedules={schedules} setSchedules={setSchedules}
          rewards={rewards} setRewards={setRewards}
          rewardsLoading={rewardsLoading} rewardsError={rewardsError}
          reportsError={reportsError} demoAdmin={localDemoAdmin}
          bins={bins} binCapacityState={binCapacityState} binCapacityError={binCapacityError}
          onSaveBinCapacity={saveBinCapacity}
          notices={notices} setNotices={setNotices}
          onLogout={() => setShowLogoutConfirm(true)}
        /></Suspense>
        {localizeText(showLogoutConfirm && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
              <div className="icon-container w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3 mx-auto text-red-600">
                <LogOut className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{localizeText(t("logout_title"))}</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">{localizeText("Are you sure you want to sign out of the municipal panel?")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {localizeText(t("logout_cancel"))}
                </button>
                <button
                  onClick={() => {
                    void signOut(auth).then(() => {
                      setDemoSession(false); demoModeRef.current=false; setDemoMode(false);
                    localDemoAdminRef.current = false;
                      setLocalDemoAdmin(false);
                      setLoggedIn(false);
                      setIsAdmin(false);
                      setShowLogoutConfirm(false);
                    }).catch(error => {
                      console.error("Could not sign out of Firebase Authentication:", error);
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                >
                  {localizeText(t("logout_confirm"))}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="app-viewport bg-slate-200/80 flex items-center justify-center sm:p-4">
      {/* Mobile Application Canvas */}
      <div className="w-full max-w-[420px] mx-auto app-shell bg-[#F8FAF9] sm:rounded-[2.8rem] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col relative select-none ring-1 ring-slate-900/10">

        {demoMode && <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2 text-[11px] text-center shrink-0" role="status"><L>Demo account · Sample data only</L></div>}

        {/* Google Maps Platform Quota Notice Banner */}
        {localizeText(quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-[11px] text-center sticky top-0 z-50 shadow-sm shrink-0">
            <span><L>{"Google Maps Platform quota reached. If you are the app owner, visit"}</L>{localizeText(" ")}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              ><L>{"maps developer site"}</L></a>{localizeText(" ")}<L>{"for instructions to update your account."}</L></span>
          </div>
        ))}

        {/* Mobile Top Dynamic Island / Speaker Pill on Desktop */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#133E26] shrink-0">
          <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Municipal Header with Mobile Status Bar */}
        <header className="px-4 py-4 shrink-0 bg-[#133E26] text-white shadow-xs">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-emerald-200/80 text-[11px] font-medium tracking-wide uppercase"><Greeting /></p>
              <h1 className="text-white text-[17px] font-bold tracking-tight leading-tight truncate max-w-[190px]">
                {userName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={localizeText(`Rewards: ${userPoints} green points`)} onClick={() => setActiveTab("Rewards")}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-full h-11 min-w-11 px-2.5 inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2.2} />
                <span className="text-white text-xs font-bold tabular-nums">{localizeText(pointsBalanceReady ? availablePoints.toLocaleString() : "—")}</span>
              </button>

              <button
                type="button"
                aria-label={localizeText("Notifications")} aria-expanded={showNotifications} onClick={() => setShowNotifications(v => !v)}
                className="relative inline-flex items-center justify-center w-11 h-11 shrink-0 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full p-0 text-white active:scale-95 transition-all"
              >
                <AnimatedIcon name={showNotifications ? "close" : "bell"} className="w-4 h-4" />
                {notices.some(n => !readNotifs.includes(n.id)) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#133E26]" />
                )}
              </button>

              <button
                type="button"
                aria-label={localizeText("Open profile")} onClick={() => setShowProfile(true)}
                className="icon-button inline-flex items-center justify-center w-11 h-11 shrink-0 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full p-0 text-white active:scale-95 transition-all"
              >
                <AnimatedIcon name={showProfile ? "close" : "user"} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Notification Slide-down Tray ── */}
        <AnimatePresence>
          {showNotifications && (() => {
            const formatNoticeDate = (date: string) => {
              const parsedDate = new Date(`${date}T00:00:00`);
              return Number.isNaN(parsedDate.getTime())
                ? ""
                : parsedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            };
            const pinnedAdminNotifs = notices.filter(n => n.pinned).map(n => ({ id: n.id, icon: Bell, title: n.title, body: n.body, time: formatNoticeDate(n.date) }));
            const unpinnedAdminNotifs = notices.filter(n => !n.pinned).map(n => ({ id: n.id, icon: Bell, title: n.title, body: n.body, time: formatNoticeDate(n.date) }));
            const allNotifs = [...pinnedAdminNotifs, ...unpinnedAdminNotifs];
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
                    <p className="text-sm font-bold text-slate-900">{localizeText(t("notif_title"))}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setReadNotifs(allIds)} className="text-xs font-semibold text-emerald-700 hover:underline">{localizeText(t("notif_mark_read"))}</button>
                      <button aria-label={localizeText("Close notifications")} onClick={() => setShowNotifications(false)} className="icon-button touch-target bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 text-slate-600">
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {allNotifs.length === 0 && (
                      <p className="px-5 py-8 text-center text-xs text-slate-500">{t("notif_empty")}</p>
                    )}
                    {allNotifs.map(n => {
                      const Icon = n.icon;
                      const isRead = readNotifs.includes(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                          className={`flex gap-3 px-5 py-3 cursor-pointer transition-colors ${isRead ? "bg-white" : "bg-emerald-50/40"}`}
                        >
                          <div className={`icon-container w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isRead ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-800"}`}>
                            <Icon className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs text-slate-900 truncate ${!isRead ? "font-bold" : "font-medium"}`}>{localizeText(n.title)}</p>
                              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">{localizeText(n.time)}</span>
                            </div>
                            <DetailsDisclosure label={localizeText("Read message")}><p>{demoMode ? localizeText(n.body) : n.body}</p></DetailsDisclosure>
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
        <main ref={appContentRef} aria-label={localizeText(`${activeTab} content`)} className="flex-1 overflow-y-auto mobile-app-scroll bg-[#F8FAF9]">

          {/* ══════════ TAB: HOME ══════════ */}
          {localizeText(activeTab === "Home" && (
            <div className="p-4 space-y-4 pb-6">

              {/* Live Collection Progress */}


              {/* Next Scheduled Collection */}
              <section aria-label={localizeText("Next Collection")}>
                {localizeText((() => {
                  const nearest = [...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b)))[0];
                  const label = nearest ? `${nearest.day}, ${nearest.date} ${(nearest as any).month ?? ""} · ${nearest.time}` : "–";
                  const zone = nearest ? `${nearest.zone} — ${nearest.type}` : "";
                  return (
                    <div className="bg-gradient-to-br from-[#14532D] to-[#15803D] rounded-2xl p-4 text-white shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">{localizeText(t("home_next_collection"))}</span>
                          <p className="text-base font-bold mt-1 tracking-tight">{localizeText(label)}</p>
                          <p className="text-xs text-emerald-100/90 mt-0.5">{localizeText(zone)}</p>
                        </div>
                        <div className="icon-container w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
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
                          <span>{localizeText(reminderSet ? reminderChoice : t("home_set_reminder"))}</span>
                        </button>

                      </div>
                    </div>
                  );
                })())}
              </section>

              <section aria-label={localizeText("Live Collection")}><DetailsDisclosure label={localizeText("Collection fleet")}>
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{localizeText(t("home_live"))}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span>{localizeText(t("header_realtime"))}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {localizeText(liveUpdates.map(truck => (
                    <div key={truck.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="icon-container w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                            <Truck className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{localizeText(truck.location)}</p>
                            <p className="text-[11px] text-slate-500">{localizeText(truck.date)} · {localizeText(truck.time)}</p>
                          </div>
                        </div>
                        <SpecularButton as="span" size="sm" radius={12} baseColor="#FFF4CD" textColor="#795314" lineColor="#D9B95F" idleIntensity={.22} glow={.4} followMouse>
                          {localizeText(t("home_eta"))} {localizeText(truck.eta)}
                        </SpecularButton>
                      </div>

                      {/* Route Milestone Line */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>{localizeText(t("home_depot"))}</span>
                          <span className="text-emerald-700">{localizeText(t("home_your_area"))}</span>
                        </div>
                        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${truck.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                          <span><L>{"Departed"}</L></span>
                          <span className="font-semibold text-slate-800 tabular-nums">{localizeText(truck.progress)}<L>{"% completed"}</L></span>
                        </div>
                      </div>
                    </div>
                  )))}
                </div>
              </DetailsDisclosure></section>

              {/* Collection Schedule Agenda */}
              <section data-reveal aria-label={localizeText("Upcoming Schedule")} ref={scheduleRef}>
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{localizeText(t("home_schedule"))}</h2>
                  <span className="text-xs text-slate-400 font-medium">{localizeText(t("home_nearest_first"))}</span>
                </div>

                <div className="space-y-2.5">
                  {localizeText([...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b))).map((s, idx) => (
                    <div key={s.id} className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center gap-3 shadow-xs ${idx === 0 ? "border-emerald-300 ring-1 ring-emerald-300/40" : "border-slate-200/80"}`}>
                      <div className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 tabular-nums ${idx === 0 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                        <span className="text-[8px] font-bold uppercase tracking-wide opacity-80">{localizeText(s.day.slice(0, 3))}</span>
                        <span className="text-base font-extrabold leading-none mt-0.5">{localizeText(s.date)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{localizeText(s.type)}</p>
                        <p className="text-[11px] text-slate-500 truncate">{localizeText(s.zone)}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" strokeWidth={2} />
                          <span className="tabular-nums">{localizeText(s.time)}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {localizeText(idx === 0 ? (
                          <SpecularButton as="span" size="sm" className="uppercase" radius={10} baseColor="#17634B" textColor="#FFFFFF" lineColor="#BCE9B0" idleIntensity={.3} glow={.5} followMouse>
                            {localizeText(t("home_badge_next"))}
                          </SpecularButton>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                            {localizeText(t("home_badge_soon"))}
                          </span>
                        ))}
                      </div>
                    </div>
                  )))}
                </div>
              </section>

              {/* Material Guide Quick Access Card */}
              <section aria-label={localizeText("Waste & Material Guide")}>
                <div
                  onClick={() => setActiveTab("Guide")}
                  className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-container w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors"><L>{"Residential Waste & Material Guide"}</L></p>
                      <p className="text-[11px] text-slate-500 mt-0.5"><L>{"Blue, Green, Black & E-Waste sorting specifications"}</L></p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </section>
            </div>
          ))}

          {/* ══════════ TAB: MAP ══════════ */}
          {activeTab === "Map" && (
            <div className="p-4 space-y-3 pb-24" onClick={() => setActiveDropdown(null)}>
              {/* Map Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span><L>{"Sime Darby Property Smart Collection"}</L></span>
                  </h2>
                  <p className="text-[10px] text-slate-500"><L>{"Collection point directory · capacity snapshots"}</L></p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span><L>{"Map & directions"}</L></span>
                </div>
              </div>

              {/* Map View Rendering */}
              <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <Suspense fallback={<p className="p-4 text-sm text-slate-500" role="status"><L>{"Loading map…"}</L></p>}><GoogleMapView
                  userAddress={epArea}
                  userZone={epZone}
                  compactFallback categoryFilter={mapFilter} capacities={binCapacities} capacityLoading={binCapacityState === "loading"} fleet={liveUpdates.filter(v => typeof v.lat === "number" && typeof v.lng === "number").map(v => ({id: String(v.id), plate: v.plate || "", township: v.location, route: v.route || v.location, lat: v.lat!, lng: v.lng!, eta: v.eta, status: v.status || ""}))} selectedStationId={selectedMapStationId ?? undefined}
                /></Suspense>
              </div>

              {binCapacityError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">{localizeText(binCapacityError)}</p>}

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {localizeText(["All", "Recycling", "General", "E-Waste"].map(f => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={mapFilter === f} onClick={() => setMapFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${mapFilter === f ? "bg-emerald-700 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
                  >
                    <AnimatedIcon name={mapFilter === f ? "check" : "filter"} className="w-3 h-3" />{localizeText(f)}
                  </button>
                )))}
              </div>

              {/* Station Listing */}
              <div className="space-y-2.5">
                {bins
                  .filter(loc => matchesFilter(loc as any, mapFilter, mapStatusFilter))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(loc => {
                    const fc = loc.fill === undefined ? null : fillColor(loc.fill);
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
                              <h3 className="text-xs font-bold text-slate-900 truncate">{localizeText(loc.name)}</h3>
                              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md ${isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                                {localizeText(loc.status)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{localizeText(locAddr)}</p>
                            <p className="text-[10px] text-emerald-700 font-medium">{localizeText(loc.type)}</p>

                            <CapacityIndicator value={loc.fill} stale={loc.capacityStale} loading={binCapacityState === "loading"} label={localizeText(loc.name)} updatedAtMs={loc.capacityUpdatedAtMs} />
                          </div>
                          <a
                            href={getGoogleMapsNavigationUrl(locLat, locLng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="map-directions icon-button" aria-label={localizeText(`Directions to ${loc.name} in Google Maps`)} title={localizeText("Open directions")}
                          >
                            <Navigation className="w-3.5 h-3.5" />
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
            <div className="p-4 space-y-4 pb-6">
              {/* Apple-style Segmented Control */}
              <div className="flex bg-slate-200/70 p-1 rounded-xl">
                {localizeText((["Reports", "Disposed Items"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActSection(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${actSection === s ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {localizeText(s === "Reports" ? t("act_reports") : t("act_disposed"))}
                  </button>
                )))}
              </div>

              {actSection === "Reports" && (
                <div className="space-y-3">
                  {localizeText(reportsError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800" role="alert">{localizeText(reportsError)}</p>)}
                  {/* Filter & + Report Button Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="filter-chip-row report-filter-chips" role="group" aria-label={localizeText("Filter reports by status")}>
                      {localizeText(["All", "Pending", "In Action", "Completed", "Rejected"].map(status => (
                        <button type="button" key={status} className="filter-chip" aria-pressed={reportFilter === status}
                          onClick={() => setReportFilter(status)}><AnimatedIcon name={reportFilter === status ? "check" : "filter"} className="w-3 h-3" />{localizeText(status)}</button>
                      )))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (showPlusModal || reportSubmitting) return;
                        setReportModal(true);
                        setReportStep(1);
                        setIssueType("");
                        setIssueDesc("");
                        setGpsActive(false);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      <span><L>{"Report"}</L></span>
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
                          <div className="icon-container w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800"><L>{"No Reports Found"}</L></p>
                            <p className="text-[11px] text-slate-500 mt-0.5"><L>{"No reports match the status \""}</L>{localizeText(reportFilter)}".</p>
                          </div>
                        </div>
                      );
                    }

                    return sortedReports.map(r => (
                      <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-slate-900">{localizeText(r.issue)}</h3>

                          </div>
                          <span className={statusColors[r.status]}>{localizeText(r.status)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.8} />
                            <span className="truncate max-w-[150px]">{r.address}</span>
                            <span>·</span>
                            <span className="tabular-nums font-medium text-emerald-800">{localizeText(r.time)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailReportId(r.id)}
                            className="font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {localizeText(t("act_view_details"))} <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {actSection === "Disposed Items" && (
                <div className="space-y-2.5">
                  {localizeText((!firebaseAuthState.ready || (firebaseAuthState.uid
                    && pickupBookingsState.uid !== firebaseAuthState.uid)
                    || pickupBookingsState.loading) && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] text-sky-800" role="status"><L>{"Loading your pickup bookings…"}</L></div>
                  ))}
                  {localizeText(firebaseAuthState.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-800" role="alert">
                      {localizeText(firebaseAuthState.error)}
                    </div>
                  ))}
                  {localizeText(firebaseAuthState.uid
                    && recyclingHistoryState.uid === firebaseAuthState.uid
                    && recyclingHistoryState.loading && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] text-sky-800" role="status"><L>{"Loading your recycling submissions…"}</L></div>
                  ))}
                  {localizeText(firebaseAuthState.uid
                    && recyclingHistoryState.uid === firebaseAuthState.uid
                    && recyclingHistoryState.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-800" role="alert">
                      <p><L>{"Could not load recycling submissions: "}</L>{localizeText(recyclingHistoryState.error)}</p>
                      <button type="button" onClick={() => setRecyclingHistoryReload(value => value + 1)} className="mt-1 font-bold underline"><L>{"Retry loading submissions"}</L></button>
                    </div>
                  ))}
                  {/* Legacy browser-record notice hidden from residents; set SHOW_LEGACY_BROWSER_NOTICE to true to restore. */}
                  {localizeText(SHOW_LEGACY_BROWSER_NOTICE && authenticatedUid && disposedItems.some(item => item.source !== "firestore" && !item.localOwnerUid) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900" role="status"><L>{"Older browser-only Activity records without an account scope are hidden to prevent showing another resident’s local history."}</L><details className="mt-2">
                        <summary className="cursor-pointer font-bold underline"><L>{"Review older browser records (read-only)"}</L></summary>
                        <p className="mt-1.5"><L>{"These records have no verified owner. They are excluded from your normal Activity history, cannot earn Green Points, and have not been saved to your account. They are only kept in this browser."}</L></p>
                        <ul className="mt-1.5 space-y-1.5">
                          {localizeText(disposedItems
                            .filter(item => item.source !== "firestore" && !item.localOwnerUid)
                            .map((item, index) => (
                              <li key={`${item.id}-${index}`} className="rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-slate-800">
                                <p className="font-bold">{localizeText(item.itemName || "Unnamed item")}</p>
                                <p><L>{"Weight: "}</L>{localizeText(item.weight || "Not recorded")}</p>
                                <p><L>{"Date: "}</L>{localizeText(item.createdAt ? new Date(item.createdAt).toLocaleString() : item.time || "Not recorded")}</p>
                                <p className="break-all"><L>{"Record ID: "}</L>{localizeText(String(item.id))}</p>
                              </li>
                            )))}
                        </ul>
                        <button
                          type="button"
                          disabled={legacyCheck.running}
                          onClick={() => void runLegacyCheck(disposedItems.filter(item => item.source !== "firestore" && !item.localOwnerUid))}
                          className="mt-2 rounded-lg border border-amber-400 bg-white px-2 py-1 font-bold disabled:opacity-50"
                        >
                          {localizeText(legacyCheck.running ? "Checking…" : "Check these records against Firestore (read-only)")}
                        </button>
                        {localizeText(legacyCheck.message && <p className="mt-1.5" role="status">{localizeText(legacyCheck.message)}</p>)}
                        {localizeText(Object.keys(legacyCheck.results).length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {localizeText(Object.entries(legacyCheck.results).map(([id, outcome]) => (
                              <li key={id} className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-slate-800">
                                <span className="break-all font-mono">{localizeText(id)}</span>: <strong>{localizeText(outcome)}</strong>
                              </li>
                            )))}
                          </ul>
                        ))}
                      </details>
                    </div>
                  ))}
                  {localizeText(firebaseAuthState.ready && !firebaseAuthState.error && !firebaseAuthState.uid && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900" role="status"><L>{"Sign in with Firebase Authentication to load pickup booking status. Local Activity previews are not proof of a saved booking."}</L></div>
                  ))}
                  {localizeText(firebaseAuthState.uid
                    && pickupBookingsState.uid === firebaseAuthState.uid
                    && pickupBookingsState.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-800" role="alert">
                      <p><L>{"Could not load pickup bookings: "}</L>{localizeText(pickupBookingsState.error)}</p>
                      <button
                        type="button"
                        onClick={() => setPickupBookingsReload(value => value + 1)}
                        className="mt-1 font-bold underline"
                      ><L>{"Retry loading bookings"}</L></button>
                    </div>
                  ))}
                  {localizeText(firebaseAuthState.uid
                    && pickupBookingsState.uid === firebaseAuthState.uid
                    && !pickupBookingsState.loading
                    && !pickupBookingsState.error
                    && pickupBookingsState.bookings.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-600" role="status"><L>{"No saved pickup bookings were found for this account. Any unmatched local pickup entries below remain previews."}</L></div>
                  ))}
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Recycle className="w-4 h-4 text-emerald-700" />
                        <span><L>{"Disposed Items History"}</L></span>
                      </h3>
                      <p className="text-[10px] text-slate-500"><L>{"Classification & drop-off records at Eco Stations"}</L></p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {localizeText(activityItems.length)}<L>{" Records"}</L></span>
                  </div>

                  {/* Disposed items list sorted recently first */}
                  {(() => {
                    const currentBookings = firebaseAuthState.uid
                      && pickupBookingsState.uid === firebaseAuthState.uid
                      ? pickupBookingsState.bookings
                      : [];
                    const bookingsBySubmissionId = new Map(
                      currentBookings.map(booking => [booking.recyclingSubmissionId, booking]),
                    );
                    const matchedSubmissionIds = new Set<string>();
                    const mergedActivity: ActivityDisposedItem[] = activityItems.map(item => {
                      const booking = bookingsBySubmissionId.get(String(item.id));
                      if (!booking) return item;
                      matchedSubmissionIds.add(booking.recyclingSubmissionId);
                      return {
                        ...item,
                        collectionMethod: "collector_pickup",
                        pickupAddress: booking.pickupAddress,
                        pickupDate: booking.pickupDate,
                        pickupTime: booking.pickupTime,
                        pickupBooking: booking,
                      };
                    });
                    const bookingOnlyItems: ActivityDisposedItem[] = currentBookings
                      .filter(booking => !matchedSubmissionIds.has(booking.recyclingSubmissionId))
                      .map(booking => ({
                        id: booking.id,
                        itemName: "Collector Pickup Booking",
                        category: "Recycling item details unavailable",
                        icon: "🚚",
                        bin: "",
                        weight: "",
                        condition: "",
                        points: 0,
                        pointsClassification: "unknown",
                        facility: "",
                        status: "Unknown",
                        time: "Pickup booking",
                        createdAt: booking.createdAt,
                        collectionMethod: "collector_pickup",
                        pickupAddress: booking.pickupAddress,
                        pickupDate: booking.pickupDate,
                        pickupTime: booking.pickupTime,
                        pickupBooking: booking,
                        bookingOnly: true,
                      }));
                    const sortedDisposed = [...mergedActivity, ...bookingOnlyItems]
                      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                    if (sortedDisposed.length === 0) {
                      const historyLoading = !firebaseAuthState.ready
                        || (firebaseAuthState.uid && recyclingHistoryState.uid !== firebaseAuthState.uid)
                        || recyclingHistoryState.loading;
                      const historyError = recyclingHistoryState.error || pickupBookingsState.error || firebaseAuthState.error;
                      return (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center space-y-2 shadow-xs">
                          <div className="icon-container w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {localizeText(historyLoading
                              ? "Loading Activity…"
                              : historyError
                                ? "Activity history unavailable"
                                : "No Disposed Items Yet")}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            {localizeText(historyError
                              ? "Your recycling Activity could not be fully verified. Check the displayed errors and retry."
                              : "Log materials you drop off at Sime Darby Eco Stations to earn Green Points and track diversion.")}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {sortedDisposed.map(item => {
                          const booking = item.pickupBooking;
                          const isBookingOnly = item.bookingOnly === true;
                          const approvedPoints = (item.source === "firestore" || (demoMode && item.source === "demo")) && item.verified === true
                            ? item.pointsApproved
                            : undefined;
                          const pendingPoints = item.pointsPending;
                          const pointsDisplay = isBookingOnly
                            ? "Recycling points unavailable"
                            : item.source === "firestore" && item.status === "Rejected"
                              ? "Rejected – no points"
                            : typeof approvedPoints === "number" && Number.isFinite(approvedPoints) && approvedPoints >= 0
                              ? `+${approvedPoints} pts approved`
                              : item.pointsClassification === "pending"
                                && typeof pendingPoints === "number"
                                && Number.isFinite(pendingPoints)
                                && pendingPoints >= 0
                                  ? `+${pendingPoints} pts pending`
                                  : "Points status unknown";
                          const isNew = item.time === "Just now" || (item.createdAt && Date.now() - item.createdAt < 300000);
                          const pickupBookingConfirmed = Boolean(booking);
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
                                    {localizeText(item.icon || "♻️")}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">
                                        {localizeText(isBookingOnly ? "Collector Pickup Booking" : item.itemName)}
                                      </h4>
                                      {localizeText(isNew && (
                                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse"><L>{"NEW"}</L></span>
                                      ))}
                                      {localizeText(!isBookingOnly && item.source === "local_preview" && (
                                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider"><L>{"Local preview"}</L></span>
                                      ))}
                                    </div>
                                    {localizeText(!isBookingOnly && (
                                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                        {localizeText(item.category)} · <span className="font-semibold text-emerald-800">{localizeText(item.bin)}</span>
                                      </p>
                                    ))}
                                    {localizeText(item.collectionMethod === "collector_pickup" && (
                                      <span className="inline-flex mt-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-800"><L>{"Collector Pickup"}</L></span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[11px] px-2 py-0.5 rounded-lg tabular-nums">
                                    {localizeText(pointsDisplay)}
                                  </span>
                                  {localizeText(item.collectionMethod === "collector_pickup" && (
                                    <span className={`mt-1 block rounded-lg border px-2 py-0.5 text-[9px] font-bold ${
                                      pickupBookingConfirmed
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
                                    }`}>
                                      {localizeText(booking
                                        ? `Pickup: ${booking.status}`
                                        : item.source === "firestore"
                                          ? "Pickup booking NOT confirmed"
                                          : `${item.pickupRequestStatus || "Requested"} · preview`)}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {item.collectionMethod === "collector_pickup" ? (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                  {localizeText(!booking && item.source === "firestore" && (
                                    <p className="text-[10px] font-medium text-amber-800" role="status"><L>{"The recycling record is saved, but no pickup booking exists for it. Open the + button to retry the booking if this session still holds its details."}</L></p>
                                  ))}
                                  {item.pickupAddress && (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="font-medium text-slate-700 break-words">{item.pickupAddress}</span>
                                  </div>
                                  )}
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium text-slate-600"><L>{"Requested: "}</L>{localizeText(item.pickupDate)} · {localizeText(item.pickupTime)}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-500 tabular-nums font-medium">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {localizeText(timeDisplay)}
                                    </span>
                                  </div>
                                  {localizeText(booking && (
                                    <>
                                      <p className="text-[10px] font-medium text-sky-800"><L>{"Pickup status: "}</L>{localizeText(booking.status)}
                                      </p>
                                      <p className="text-[10px] text-slate-600 break-all"><L>{"Recycling submission: "}</L>{localizeText(booking.recyclingSubmissionId)}
                                      </p>
                                      {localizeText(booking.statusNote && (
                                        <p className="text-[10px] text-slate-600"><L>{"Booking note: "}</L>{localizeText(booking.statusNote)}</p>
                                      ))}
                                      {localizeText(!isBookingOnly && (
                                        <p className="text-[10px] text-slate-600"><L>{"Recycling status: "}</L>{localizeText(item.status)}
                                        </p>
                                      ))}
                                      {localizeText(isBookingOnly && (
                                        <p className="text-[10px] text-slate-600"><L>{"Recycling status: unavailable"}</L></p>
                                      ))}
                                      <p className="text-[10px] text-amber-800"><L>{"Pickup booking status does not verify recycling or approve Green Points."}</L></p>
                                    </>
                                  ))}
                                  {localizeText(!booking && (
                                    <p className="text-[10px] text-amber-800">
                                      {localizeText(item.source === "firestore"
                                        ? "No pickup booking is confirmed in Firestore for this saved recycling record. Points remain subject to recycling verification and Admin approval."
                                        : "Preview only — no pickup booking is confirmed in Firestore. Points remain subject to recycling verification and Admin approval.")}
                                    </p>
                                  ))}
                                  {localizeText(!isBookingOnly && (
                                    <span className="text-[10px] text-slate-500">{localizeText(item.weight)}</span>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                  <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{localizeText(item.facility || "Sime Darby Eco Station")}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-medium text-slate-600">{localizeText(item.weight)}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1 text-slate-500 tabular-nums font-medium">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {localizeText(timeDisplay)}
                                    </span>
                                  </div>
                                </div>
                              )}
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
          {localizeText(activeTab === "Rewards" && (
            <div className="p-4 space-y-4 pb-6">

              {/* Show the points dashboard only on the rewards overview. */}
              {localizeText(rewardsSubPage === "" && (
              <div className="bg-gradient-to-br from-[#133E26] via-[#15803D] to-[#16A34A] rounded-2xl p-5 text-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider"><L>{"Admin-approved Green Points"}</L></span>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight tabular-nums">{localizeText(pointsBalanceReady ? availablePoints.toLocaleString() : "—")}</p>
                  </div>
                  <div className="icon-container w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <Trophy className="w-6 h-6 text-amber-300" strokeWidth={2} />
                  </div>
                </div>

                <DetailsDisclosure label={localizeText("Your impact")}>
                <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{localizeText(totalReports)}</p>
                    <p className="text-[10px] text-emerald-200">{localizeText(t("act_reports"))}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{localizeText(collectedCount ?? "—")}</p>
                    <p className="text-[10px] text-emerald-200">{localizeText(t("rew_collected"))}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <p className="text-sm font-bold tabular-nums">{localizeText(recycledKg ?? "—")}</p>
                    <p className="text-[10px] text-emerald-200">{localizeText(t("rew_recycled_kg"))}</p>
                  </div>
                </div>
                </DetailsDisclosure>
                {localizeText(recyclingHistoryState.error && (
                  <p className="mt-3 rounded-xl border border-red-200/40 bg-red-950/20 p-2 text-[10px] text-amber-100" role="alert"><L>{"Verified recycling totals are unavailable: "}</L>{localizeText(recyclingHistoryState.error)}
                  </p>
                ))}
              </div>
              ))}

              {/* Rewards Subpages */}
              {localizeText(rewardsSubPage === "redeem" ? (rewardDetail ? <RewardDetails reward={rewardDetail} points={availablePoints} canRedeem={redemptionServiceReady && pointsBalanceReady} onBack={() => setRewardDetail(null)} onRedeem={() => redeemDetailedReward(rewardDetail)} /> : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1">
                    <BackButton onClick={() => setRewardsSubPage("")} label={localizeText("Back to rewards")} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{localizeText(t("rew_redeem_title"))}</h3>
                  </div>
                  {localizeText(rewardsLoading && (
                    <p role="status" className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"><L>{"Loading rewards catalogue..."}</L></p>
                  ))}
                  {localizeText(rewardsError && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {localizeText(rewardsError)}
                    </p>
                  ))}
                  {localizeText(!rewardsLoading && !rewardsError && rewards.length === 0 && (
                    <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"><L>{"No rewards are currently available."}</L></p>
                  ))}
                  {localizeText(!redemptionServiceReady && (
                    <DetailsDisclosure label={localizeText("Redemption unavailable")}><p><L>{"The reward service is not ready. You can still browse reward details."}</L></p></DetailsDisclosure>
                  ))}
                  {localizeText(redemptionServiceReady && !pointsBalanceReady && !recyclingHistoryState.loading && !redemptionsLoading && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900" role="status"><L>{"Your points balance could not be confirmed, so redemption is paused. Reload the page to try again."}</L></p>
                  ))}
                  <div className="space-y-2.5">
                    {localizeText(rewards.map(r => {
                      const remainingStock = r.maxRedemptions - r.redeemed;
                      const rewardAvailable = Boolean(r.firestoreId) && !r.banned && remainingStock > 0;
                      const enoughPoints = pointsBalanceReady && availablePoints >= r.points;
                      const canRedeem = redemptionServiceReady && rewardAvailable && enoughPoints;
                      const rewardKey = r.firestoreId ?? String(r.id);
                      const isRedeeming = redeemingRewards.has(rewardKey);
                      const description = "description" in r && typeof r.description === "string"
                        ? r.description
                        : "";
                      return (
                        <div key={r.firestoreId ?? r.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{localizeText(r.icon)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900">{localizeText(r.name)}</p>
                              {localizeText(description && (
                                <p className="mt-0.5 text-[11px] text-slate-500">{localizeText(description)}</p>
                              ))}
                              {localizeText(r.category && (
                                <p className="mt-0.5 text-[10px] text-slate-500">{localizeText(r.category)}</p>
                              ))}
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {localizeText(r.points)}<L>{" Green Points"}</L></span>
                              {localizeText(!rewardAvailable && (
                                <p className="mt-0.5 text-[10px] text-slate-500">{localizeText(r.banned ? "Currently unavailable" : "Out of stock")}</p>
                              ))}
                              {localizeText(rewardAvailable && pointsBalanceReady && !enoughPoints && (
                                <p className="mt-0.5 text-[10px] text-slate-500"><L>{"Need "}</L>{localizeText(r.points - availablePoints)}<L>{" more approved points"}</L></p>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={localizeText(`View details for ${r.name}`)}
                            onClick={() => setRewardDetail(r)}
                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          ><L>{"Details"}</L></button>
                        </div>
                      );
                    }))}
                  </div>
                </div>
              )) : rewardsSubPage === "history" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1">
                    <BackButton onClick={() => setRewardsSubPage("")} label={localizeText("Back to rewards")} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{localizeText(t("rew_pts_history"))}</h3>
                  </div>
                  {localizeText(myRedeemedList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-xs">
                      <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        {localizeText(redemptionsLoading ? "Loading redemption history…" : redemptionsError ? "Redemption history unavailable" : "No Vouchers Claimed Yet")}
                      </p>
                      {localizeText(redemptionsError && <p role="alert" className="text-[11px] text-red-700 mt-1">{localizeText(redemptionsError)}</p>)}
                      {localizeText(!redemptionsLoading && !redemptionsError && <p className="text-[11px] text-slate-500 mt-1"><L>{"Only records linked to this authenticated account appear here."}</L></p>)}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {localizeText(myRedeemedList.map(item => (
                        <div key={item.uid} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{localizeText(item.icon)}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{localizeText(item.name)}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5"><L>{"Code: "}</L>{localizeText(item.code)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQrReward(item)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                          ><L>{"Show QR"}</L></button>
                        </div>
                      )))}
                    </div>
                  ))}
                </div>
              ) : rewardsSubPage === "eligibility" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1">
                    <BackButton onClick={() => setRewardsSubPage("")} label={localizeText("Back to rewards")} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{localizeText(t("rew_eligibility"))}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Leaf className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900"><L>{"Incident Reports"}</L></p>
                        <DetailsDisclosure label={localizeText("How it works")}><p><L>{"+8 points for resolved hazard reports verified by municipal teams."}</L></p></DetailsDisclosure>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Recycle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900"><L>{"Drop-Off Recycling"}</L></p>
                        <DetailsDisclosure label={localizeText("How it works")}><p><L>{"10 points per kg deposited at verified smart drop stations."}</L></p></DetailsDisclosure>
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
                      <div className="icon-container w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Gift className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{localizeText(t("rew_redeem_title"))}</p>
                        <p className="text-[11px] text-slate-500">{localizeText(rewardsLoading || rewardsError ? "—" : rewards.length)} {localizeText(t("rew_available"))}</p>
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
                      <div className="icon-container w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Clock className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{localizeText(t("rew_pts_history"))}</p>
                        <p className="text-[11px] text-slate-500">{localizeText(t("rew_verified_credited"))}</p>
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
                      <div className="icon-container w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Star className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{localizeText(t("rew_eligibility"))}</p>
                        <p className="text-[11px] text-slate-500">{localizeText(t("rew_all_unlocked"))}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* ══════════ TAB: GUIDE ══════════ */}
          {localizeText(activeTab === "Guide" && (
            <div className="p-4 space-y-3.5 pb-24">
              <div className="bg-[#14532D] text-white rounded-2xl p-4 shadow-xs">
                <h2 className="text-sm font-bold tracking-tight">{localizeText(t("guide_title"))}</h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">{localizeText(t("guide_subtitle"))}</p>
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
                ><L>{"4 Bins Standard"}</L></button>
                <button
                  type="button"
                  onClick={() => setGuideViewMode("materials")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    guideViewMode === "materials"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                ><L>{"Material Directory ("}</L>{localizeText(MANUAL_GUIDE_ITEMS.length)})
                </button>
              </div>

              {localizeText(guideViewMode === "bins" ? (
                /* 4 Bins Specification */
                <div className="space-y-3">
                  {localizeText([
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
                        <h3 className="text-xs font-bold text-slate-900">{localizeText(bin.title)}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${bin.bg}`}>
                          {localizeText(bin.badge)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">{localizeText(bin.subtitle)}</p>
                      <DetailsDisclosure label={localizeText("What goes here")}><ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">{localizeText(bin.items.map(item => <li key={item}>{localizeText(item)}</li>))}</ul></DetailsDisclosure>
                    </div>
                  )))}
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
                      placeholder={localizeText("Search material rules (e.g. plastic, cans, battery)...")}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all shadow-2xs"
                    />
                    {localizeText(guideSearch && (
                      <button
                        type="button"
                        onClick={() => setGuideSearch("")}
                        className="icon-button absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>

                  {/* Category Pills */}
                  <div className="filter-chip-row">
                    {localizeText(["All", "Recyclables", "Organic", "General Waste", "E-Waste", "Bulky"].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={guideCategory === cat} onClick={() => setGuideCategory(cat)}
                        className="filter-chip"
                      >
                        <AnimatedIcon name={guideCategory === cat ? "check" : "filter"} className="w-3 h-3" />{localizeText(cat)}
                      </button>
                    )))}
                  </div>

                  {/* Materials Listing */}
                  <div className="space-y-2.5">
                    {localizeText(MANUAL_GUIDE_ITEMS
                      .filter(item => {
                        const matchesCat = guideCategory === "All" || item.category === guideCategory;
                        const q = guideSearch.trim().toLowerCase();
                        const matchesQuery = !q ||
                          item.name.toLowerCase().includes(q) ||
                          item.rule.toLowerCase().includes(q) ||
                          item.bin.toLowerCase().includes(q) ||
                          item.category.toLowerCase().includes(q) ||
                          [item.name, item.rule, item.bin, item.category].some(value => localizeText(value).toLocaleLowerCase(currentLocale()).includes(q));
                        return matchesCat && matchesQuery;
                      })
                      .map(item => (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-200/80 hover:border-emerald-500 rounded-2xl p-3.5 shadow-2xs transition-all space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-2xl shrink-0 bg-slate-50 group-hover:bg-emerald-50 p-1.5 rounded-xl transition-colors">
                                {localizeText(item.icon)}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-900 transition-colors">
                                  {localizeText(item.name)}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${item.binBg} ${item.binColor} ${item.binText}`}>
                                    {localizeText(item.bin)}
                                  </span>
                                  {localizeText(item.points && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      +{localizeText(item.points)}<L>{" pts/kg"}</L></span>
                                  ))}
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
                            ><L>{"Details "}</L><ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <DetailsDisclosure label={localizeText("Sorting rule")}><p>{localizeText(item.rule)}</p></DetailsDisclosure>
                        </div>
                      )))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        </main>

        {showLangLoading && langPending && <LanguageTransition language={langPending} onComplete={() => { setShowLangLoading(false); setLangPending(null); setProfileSubPage(""); }} />}

        {/* ── Fixed Mobile Bottom Tab Bar ── */}
        <nav aria-label={localizeText("Main navigation")} className="bottom-nav flex shrink-0 bg-white border-t border-slate-200 px-2 py-1.5 items-center justify-between z-30 shadow-lg">
          <button
            type="button"
            aria-current={activeTab === "Home" ? "page" : undefined} onClick={() => setActiveTab("Home")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Home" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <Home className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Home" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{localizeText(t("nav_home"))}</span>
          </button>

          <button
            type="button"
            aria-current={activeTab === "Map" ? "page" : undefined} onClick={() => setActiveTab("Map")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Map" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <MapPin className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Map" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{localizeText(t("nav_map"))}</span>
          </button>

          {/* Elevated Centre Action Button ("+") */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={() => {
                if (reportModal || reportSubmitting) return;
                if (reopenPendingPickupBooking()) return;
                recycleSubmissionIdRef.current = null;
                resetCollectionSelection();
                setShowPlusModal(true); setPlusStep(0); setPlusMode(""); setPlusPhoto(false); setPlusDesc("");
                setPlusCategory(""); setPlusItemType(""); setPlusCondition(""); setPlusWeight("");
                setPlusWeightError("");
                setPlusAiSuggestion(null); setPlusSelectedRoute(""); setPlusDone(false);
                setPlusGuideSearch(""); setPlusGuideCategory("All"); setSelectedGuideItem(null);
              }}
              className="icon-button w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform border-3 border-white ring-2 ring-emerald-700/20 cursor-pointer"
              aria-label={localizeText("Dispose or Recycle Item")}
            >
              <AnimatedIcon name={showPlusModal ? "close" : "plus"} className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            aria-current={activeTab === "Activity" ? "page" : undefined} onClick={() => setActiveTab("Activity")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Activity" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Activity" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{localizeText(t("nav_activity"))}</span>
          </button>

          <button
            type="button"
            aria-current={activeTab === "Guide" ? "page" : undefined} onClick={() => setActiveTab("Guide")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${activeTab === "Guide" ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"}`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" strokeWidth={activeTab === "Guide" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">{localizeText(t("nav_guide"))}</span>
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
                <div className="px-5 pb-3 flex items-center gap-2 border-b border-slate-100">
                  {localizeText(profileSubPage !== "" && <BackButton onClick={() => setProfileSubPage("")} label={localizeText("Back to profile")} />)}
                  <h2 className="flex-1 text-sm font-bold text-slate-900">
                    {localizeText(profileSubPage === "language" ? t("prof_language") : profileSubPage === "feedback" ? t("prof_feedback") : profileSubPage === "switchAccount" ? "Select Account" : profileSubPage === "sharedData" ? "Information Shared" : t("prof_account"))}
                  </h2>
                  <button aria-label={localizeText("Close profile")} onClick={() => { setShowProfile(false); setProfileSubPage(""); }} className="icon-button p-1 rounded-full bg-slate-100 text-slate-600">
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
                            <p className="text-[11px] text-slate-500 truncate">{localizeText(epEmail)}</p>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {localizeText(epZone)} · {localizeText(epArea)}
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
                              <span className="font-semibold text-slate-800 block"><L>{"Select / Switch Account"}</L></span>
                              <span className="text-[10px] text-slate-400 block truncate"><L>{"Choose another resident profile or Google account"}</L></span>
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
                              <span className="font-semibold text-slate-800 block"><L>{"Information Shared with BinGo"}</L></span>
                              <span className="text-[10px] text-slate-400 block truncate"><L>{"Review data shared (Name, Email, Zone, etc.)"}</L></span>
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
                              <span className="font-semibold text-slate-800 block">{localizeText(t("prof_guidelines"))}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{localizeText(t("prof_guidelines_sub"))}</span>
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
                            <span className="font-semibold text-slate-800">{localizeText(t("prof_language"))}</span>
                          </div>
                          <span className="text-slate-400 font-medium">{localizeText(appLanguage === "en" ? "English" : "Bahasa Melayu")}</span>
                        </button>

                        {/* Feedback */}
                        <button
                          type="button"
                          onClick={() => { setFeedbackSent(false); setFeedbackError(""); setProfileSubPage("feedback"); }}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-emerald-700" />
                            <span className="font-semibold text-slate-800">{localizeText(t("prof_feedback"))}</span>
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
                        <span>{localizeText(t("prof_signout"))}</span>
                      </button>
                    </>
                  )}

                  {/* ── Subpage: Switch / Select Account ── */}
                  {profileSubPage === "switchAccount" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900"><L>{"Choose Resident Account"}</L></h3>
                          <p className="text-[11px] text-slate-500"><L>{"Accounts saved on this Chrome browser"}</L></p>
                        </div>
                      </div>

                      {/* Info Notice about device-specific dynamic storage */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2">
                        <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-snug"><L>{"Accounts shown here are dynamically remembered for this browser only. Strangers' accounts on other devices are never displayed."}</L></p>
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
                                  {localizeText(acc.photoURL ? (
                                    <img src={acc.photoURL} alt={acc.name} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${acc.bg || "bg-emerald-700 text-white"}`}>
                                      {acc.avatar || acc.name.charAt(0)}
                                    </div>
                                  ))}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                      <span>{acc.name}</span>
                                      {localizeText(isActive && (
                                        <span className="text-[9px] font-extrabold bg-emerald-700 text-white px-1.5 py-0.2 rounded-full"><L>{"Active"}</L></span>
                                      ))}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-0.5 inline-block truncate max-w-[180px]">
                                      {localizeText(acc.zone)}
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
                                    {localizeText(isActive ? "Current" : "Switch")}
                                  </button>
                                  {localizeText(!isActive && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDeviceAccount(acc.id, acc.name);
                                      }}
                                      title={localizeText("Remove from this browser")}
                                      className="icon-button p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
                            <p className="text-xs font-semibold text-slate-700"><L>{"No other saved accounts"}</L></p>
                            <p className="text-[11px] text-slate-500 mt-0.5"><L>{"Accounts you sign into on this device will be listed here."}</L></p>
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
                          <span className="group-hover:text-slate-900"><L>{"+ Add Another Google Account"}</L></span>
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
                          <span><L>{"Sign into Another Account"}</L></span>
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
                          <p className="text-xs font-bold text-emerald-950"><L>{"See what information is shared with BinGo"}</L></p>
                          <p className="text-[11px] text-emerald-800/90 mt-0.5"><L>{"Transparency report on how your Name, Email, and Location are utilized."}</L></p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* ── Subpage: Information Shared with BinGo ── */}
                  {profileSubPage === "sharedData" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900"><L>{"Information Shared with BinGo"}</L></h3>
                          <p className="text-[11px] text-slate-500"><L>{"Data usage & civic privacy transparency"}</L></p>
                        </div>
                      </div>

                      <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
                        <div className="icon-container w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-950"><L>{"Active Resident Account: "}</L>{userName}</p>
                          <p className="text-[11px] text-emerald-800 mt-0.5"><L>{"The following details are securely linked to your BinGo application profile:"}</L></p>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {/* Name */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <User className="w-3.5 h-3.5 text-emerald-700" /><L>{"Name"}</L></span>
                          <p className="text-sm font-bold text-slate-900">{userName}</p>
                        </div>

                        {/* Email */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Mail className="w-3.5 h-3.5 text-emerald-700" /><L>{"Email Address"}</L></span>
                          <p className="text-sm font-bold text-slate-900">{localizeText(epEmail)}</p>
                        </div>

                        {/* Zone & Area */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" /><L>{"Residential Area & Zone"}</L></span>
                          <p className="text-sm font-bold text-slate-900">{localizeText(epZone)} · {localizeText(epArea)}</p>
                        </div>

                        {/* Phone */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-700" /><L>{"Phone Number"}</L></span>
                          <p className="text-sm font-bold text-slate-900">{localizeText(epPhone)}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setProfileSubPage("")}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        ><L>{"Close"}</L></button>
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
        onClick={() => {
          if (l.code !== appLanguage) {
            setLangPending(l.code);
            setShowLangLoading(true);
          }
        }}
        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
          appLanguage === l.code
            ? "border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        <div>
          <p className="font-bold">{localizeText(l.label)}</p>
          <p className="text-[11px] text-slate-500 font-normal">
            {localizeText(l.desc)}
          </p>
        </div>
        {appLanguage === l.code && (
          <CheckCheck className="w-4 h-4 text-emerald-700" />
        )}
      </button>
    ))}
  </div>
)}

                  {profileSubPage === "feedback" && feedbackSent && (
                    <div className="space-y-3 text-center py-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" strokeWidth={1.5} />
                      <p className="text-sm font-bold text-slate-900">{t("prof_fb_sent_title")}</p>
                      <p className="text-xs text-slate-600">{t("prof_fb_sent_body")}</p>
                      <button type="button" onClick={closeFeedback}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-xs">
                        {t("btn_done")}
                      </button>
                    </div>
                  )}

                  {profileSubPage === "feedback" && !feedbackSent && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">{localizeText(t("prof_fb_question"))}</p>
                      <div className="flex gap-2 justify-center py-2">
                        {localizeText([1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" disabled={feedbackSubmitting} onClick={() => { setFeedbackRating(s); setFeedbackError(""); }} className="icon-button p-1">
                            <Star className={`w-7 h-7 ${s <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                          </button>
                        )))}
                      </div>
                      <textarea
                        maxLength={1000}
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder={localizeText(t("prof_fb_ph"))}
                        rows={3}
                        disabled={feedbackSubmitting}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600"
                      />
                      <p className="text-[11px] text-slate-500">{t("prof_fb_privacy")}</p>
                      {feedbackError && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">{feedbackError}</p>}
                      <button
                        type="button"
                        disabled={feedbackSubmitting}
                        onClick={() => void submitFeedback()}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-xs disabled:opacity-60"
                      >
                        {feedbackSubmitting ? t("prof_fb_sending") : t("prof_fb_submit")}
                      </button>
                      {localizeText(feedbackError && <p role="alert" className="text-xs text-red-700">{localizeText(feedbackError)}</p>)}
                      {localizeText(feedbackSent && <p role="status" className="text-xs text-emerald-700"><L>{"Feedback saved. Thank you!"}</L></p>)}
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
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeDisposalModal} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                ref={plusDialogRef} role="dialog" aria-modal="true" aria-label={localizeText("Dispose or recycle an item")}
                className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85%] z-10"
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                {localizeText((plusMode === "manual" || plusMode === "ai") && plusStep >= 1 ? (
                  <div className="border-b border-slate-100">
                    <div className="px-5 pb-2 flex items-center justify-between">
                      <button
                        type="button"
                        aria-label={localizeText("Previous step")} disabled={plusSubmitting || pickupOperationStatus !== "idle"}
                        onClick={() => {
                          if (plusSubmitting || pickupOperationStatus !== "idle") return;
                          if (plusStep === 1) {
                            recycleSubmissionIdRef.current = null;
                            setPlusStep(0);
                            setPlusMode("");
                          } else {
                            setPlusStep(s => s - 1);
                          }
                        }}
                        className="icon-button w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="text-center">
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">
                          {localizeText(plusMode === "ai" ? (
                            <>
                              {localizeText(plusStep === 1 && "Capture Item")}
                              {localizeText(plusStep === 2 && "AI Analysis")}
                              {localizeText(plusStep === 3 && "Review & Confirm")}
                              {localizeText(plusStep === 4 && "Disposal Path")}
                              {localizeText(plusStep === 5 && "Facility Review")}
                              {localizeText(plusStep === 6 && "Next Action")}
                            </>
                          ) : (
                            <>
                              {localizeText(plusStep === 1 && "Item Details")}
                              {localizeText(plusStep === 2 && "Confirm Details")}
                              {localizeText(plusStep === 3 && "Disposal Path")}
                              {localizeText(plusStep === 4 && "Management Review")}
                              {localizeText(plusStep === 5 && "Next Action")}
                            </>
                          ))}
                        </h2>
                        <p className="text-[11px] text-[#236B37] font-semibold mt-0.5"><L>{"Step "}</L>{localizeText(plusStep)}<L>{" of "}</L>{localizeText(plusMode === "ai" ? 6 : 5)}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={localizeText("Close disposal flow")} disabled={plusSubmitting}
                        onClick={closeDisposalModal}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 pb-4">
                      <FlowStepper disabled={plusSubmitting || pickupOperationStatus !== "idle"} reachable={plusSubmitting || pickupOperationStatus !== "idle" ? plusStep : plusReachableStep} onStepSelect={step => { if (plusSubmitting || pickupOperationStatus !== "idle") return; imageReadIdRef.current++; setPlusAiLoading(false); setPlusStep(step); }} current={plusStep} steps={plusMode === "ai" ? ["Photo", "Analyse", "Review", "Disposal", "Facility", "Done"] : ["Item", "Review", "Disposal", "Facility", "Done"]} />
                    </div>
                  </div>
                ) : (
                  <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900">{localizeText(t("plus_title"))}</h2>
                    <button aria-label={localizeText("Close disposal flow")} disabled={plusSubmitting} onClick={closeDisposalModal} className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="p-5 overflow-y-auto space-y-3">
                  {localizeText(plusStep === 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">{localizeText(t("plus_choose_desc"))}</p>

                      <button
                        type="button"
                        onClick={() => {
                          imageReadIdRef.current += 1;
                          setPlusImageError("");
                          clearCameraSuggestion();
                          setPlusWeight("");
                          setPlusWeightError("");
                          setPlusDesc("");
                          setPlusPhoto(false);
                          setPlusPhotoUrl("");
                          setPlusMode("ai");
                          setPlusStep(1);
                        }}
                        className="w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <div className="icon-container w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">{localizeText(t("plus_ai_title"))}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{localizeText(t("plus_ai_desc"))}</p>
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
                          setPlusWeightError("");
                          setCatBoxOpen(true);
                          setItemTypeBoxOpen(true);
                          setConditionBoxOpen(true);
                          setCatScrollProgress(0);
                          setPlusMode("manual");
                          setPlusStep(1);
                        }}
                        className="w-full p-4 rounded-2xl border border-slate-200 hover:border-slate-300 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <div className="icon-container w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">{localizeText(t("plus_manual_title"))}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{localizeText(t("plus_manual_desc"))}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 mt-2" />
                      </button>
                    </div>
                  ))}

                  {/* ══════════ AI CAMERA ASSISTANT: 6-STEP LOGICAL FLOW ══════════ */}
                  {/* ══════════ AI CAMERA ASSISTANT: 6-STEP LOGICAL FLOW ══════════ */}
                  {localizeText(plusStep === 1 && plusMode === "ai" && (() => {
                    const isStep1Valid = Boolean(plusPhoto && plusPhotoUrl && !plusImageError);
                    return (
                      <div className="space-y-4 pb-2">
                        <PhotoInput photo={plusPhotoUrl} onClear={() => {
                          imageReadIdRef.current++; setPlusPhoto(false); setPlusPhotoUrl(""); setPlusImageError(""); clearCameraSuggestion();
                        }} onReady={photo => {setPlusPhotoUrl(photo); setPlusPhoto(true); setPlusImageError("");}} />

                        {/* Run the local waste model on the selected photo. */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={!isStep1Valid || plusAiLoading}
                            onClick={() => {
                              if (isStep1Valid) {
                                setPlusAiLoading(true);
                                setPlusAiError("");
                                setPlusAiSuggestion(null);
                                setPlusDetectedItem("");
                                setPlusStep(2);
                                void analyzeCameraPhoto();
                              }
                            }}
                            className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-xs transition-all text-center flex items-center justify-center gap-2 ${
                              isStep1Valid
                                ? "bg-[#236B37] hover:bg-[#1b552b] text-white cursor-pointer active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <span><L>{"Analyze Photo →"}</L></span>
                          </button>
                          {localizeText(!isStep1Valid && (
                            <p className="text-[10px] text-amber-700 text-center font-medium mt-1.5"><L>{"Every field is required to be filled before continuing to next step. (Photo required)"}</L></p>
                          ))}
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 2: AI ANALYSIS (Images 2 & 3) ══════════ */}
                  {localizeText(plusStep === 2 && plusMode === "ai" && (() => {
                    const suggestedCategory = plusAiSuggestion ? BIN_GO_CATEGORY_BY_LABEL[plusAiSuggestion.label] : null;
                    if (plusAiLoading) {
                      return (
                        <div className="py-14 text-center space-y-4">
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
                          <div>
                            <h3 className="text-base font-bold text-slate-900"><L>{"Loading the waste model and analyzing your photo..."}</L></h3>
                            <p className="text-xs text-emerald-700 mt-1"><L>{"Your photo is analyzed locally in this browser."}</L></p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4 pb-2">
                        <div className="shine-tip suggestion-card border rounded-3xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="icon-container shine-star w-7 h-7 rounded-full bg-[#1B6D36] text-white flex items-center justify-center shadow-xs">
                                <Star className="w-4 h-4 fill-white" />
                              </div>
                              <h4 className="text-xs font-bold text-emerald-950"><L>{plusAiSuggestion ? "AI Material Prediction" : "AI Recognition Unavailable"}</L></h4>
                            </div>
                          </div>

                          {localizeText(plusAiSuggestion ? (
                            <>
                              <p className="text-xs text-slate-600"><L>{"Predicted by the WasteWise model from your selected photo. The score is not a guarantee; check the material and choose the exact item yourself."}</L></p>
                              <div className="divide-y divide-emerald-200/60 pt-1 text-xs">
                                <div className="py-2.5 flex justify-between items-center">
                                  <span className="text-slate-600 font-medium"><L>{"Model label"}</L></span>
                                  <span className="font-bold text-slate-900">{localizeText(plusAiSuggestion.label)}</span>
                                </div>
                                <div className="py-2.5 flex justify-between items-center">
                                  <span className="text-slate-600 font-medium"><L>{"Model score"}</L></span>
                                  <span className="font-bold text-slate-900">{(plusAiSuggestion.score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="py-2.5 flex justify-between items-center">
                                  <span className="text-slate-600 font-medium"><L>{"BinGo category"}</L></span>
                                  <span className="font-bold text-slate-900">{localizeText(suggestedCategory?.category || "Choose manually")}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-600"><L>{plusAiError || "No AI prediction is available. Retry or choose the category and item type manually."}</L></p>
                              <button type="button" onClick={() => { void analyzeCameraPhoto(); }} disabled={plusAiLoading || !plusPhotoUrl} className="px-3 py-1.5 rounded-full border border-emerald-700 text-emerald-800 text-[11px] font-bold disabled:opacity-50"><L>{"Retry AI analysis"}</L></button>
                            </div>
                          ))}
                        </div>

                        {localizeText(plusAiSuggestion && !suggestedCategory && <p className="text-[11px] text-amber-700 text-center"><L>{"This model label has no reliable BinGo category mapping. Choose a category manually."}</L></p>)}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const suggestion = plusAiSuggestion;
                              const mapped = suggestion ? BIN_GO_CATEGORY_BY_LABEL[suggestion.label] : null;
                              const validCategory = mapped && MANUAL_CATEGORIES.some(category => category.name === mapped.category);
                              const validItemType = mapped?.itemType && CATEGORY_ITEM_TYPES[mapped.category]?.includes(mapped.itemType) ? mapped.itemType : "";
                              setPlusCategory(validCategory ? mapped.category : "");
                              setPlusItemType(validItemType);
                              setPlusStep(3);
                            }}
                            className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{plusAiSuggestion && suggestedCategory ? "Review & Confirm →" : "Continue to Manual Selection →"}</L></button>
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 3: REVIEW & CONFIRM (Image 4) ══════════ */}
                  {localizeText(plusStep === 3 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory);
                    const weightKg = parsePositiveWeightKg(plusWeight);
                    const isStep3Valid = Boolean(plusCategory.trim() && plusItemType.trim() && weightKg !== null);

                    return (
                      <div className="space-y-3 pb-2">
                        <p className="text-xs text-emerald-700"><L>{plusAiSuggestion ? "Review or change the AI material suggestion, then choose the exact item type yourself." : "AI recognition was unavailable. Choose the material category and exact item type manually."}</L></p>

                        {/* Row 1: Category (Image 4) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Category "}</L><span className="text-red-500">*</span></span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                {localizeText(selectedCatObj && <span>{localizeText(selectedCatObj.icon)}</span>)}
                                <span>{localizeText(plusCategory || "Select a category")}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setPlusShowCatPicker(!plusShowCatPicker)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors"
                              >
                                {localizeText(plusShowCatPicker ? "Close" : "Change")}
                              </button>
                            </div>
                          </div>
                          {localizeText(plusShowCatPicker && (
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                              {localizeText(MANUAL_CATEGORIES.map(cat => (
                                <button
                                  key={cat.name}
                                  type="button"
                                  onClick={() => {
                                    setPlusCategory(cat.name);
                                    setPlusShowCatPicker(false);
                                    if (!CATEGORY_ITEM_TYPES[cat.name]?.includes(plusItemType)) {
                                      setPlusItemType("");
                                    }
                                  }}
                                  className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    plusCategory === cat.name
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{localizeText(cat.icon)}</span>
                                  <span className="truncate">{localizeText(cat.name)}</span>
                                </button>
                              )))}
                            </div>
                          ))}
                        </div>

                        {/* Row 2: Item Type (Image 4) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Item Type "}</L><span className="text-red-500">*</span></span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">{localizeText(plusItemType || "Select an item type")}</span>
                              <button
                                type="button"
                                onClick={() => setPlusShowItemTypePicker(!plusShowItemTypePicker)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors"
                              >
                                {localizeText(plusShowItemTypePicker ? "Close" : "Change")}
                              </button>
                            </div>
                          </div>
                          {localizeText(plusShowItemTypePicker && (
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                              {localizeText((CATEGORY_ITEM_TYPES[plusCategory] || []).map(type => (
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
                                  {localizeText(type)}
                                </button>
                              )))}
                            </div>
                          ))}
                        </div>

                        {/* Row 3: Quantity / Weight (Image 4 - Required) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
                          <label className="text-xs font-bold text-slate-900 block"><L>{"Weight (kg) "}</L><span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={plusWeight}
                            onChange={e => {
                              setPlusWeight(e.target.value);
                              setPlusWeightError("");
                            }}
                            placeholder={localizeText("e.g. 3.5")}
                            className="w-full bg-[#EAF5ED] border border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 font-medium placeholder:text-slate-400"
                          />
                          {localizeText((plusWeightError || (plusWeight.trim() && weightKg === null)) && (
                            <p className="text-[10px] text-red-700" role="alert">
                              {localizeText(plusWeightError || "Enter a positive weight in kg using numbers only (for example, 3.5).")}
                            </p>
                          ))}
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
                          ><L>{"Continue →"}</L></button>
                          {localizeText(!isStep3Valid && (
                            <p className="text-[10px] text-amber-700 text-center font-medium mt-1.5"><L>{"Complete the required fields."}</L></p>
                          ))}
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 4: DISPOSAL PATH ══════════ */}
                  {localizeText(plusStep === 4 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const pointRate = resolveMaterialPointsPerKg(plusCategory, plusItemType);
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Target Sorting Stream Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider"><L>{"Designated Bin & Path"}</L></span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedCatObj.targetColor}`}>
                              {localizeText(selectedCatObj.bin)}
                            </span>
                          </div>

                          <div className="bg-[#F4F9F5] rounded-xl p-3 flex items-center gap-3">
                            <span className="text-3xl shrink-0">{localizeText(selectedCatObj.icon)}</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{localizeText(plusItemType)} ({localizeText(plusCategory)})</h4>
                              <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                {localizeText(pointRate
                                  ? `+${pointRate.points} Green Points per kg, pending verification`
                                  : "Points-per-kg rate is not defined")}
                              </p>
                              {localizeText(pointRate?.usesCategoryRate && (
                                <p className="text-[10px] text-amber-700 mt-1"><L>{"The Guide does not define a material-specific rate; this uses the existing "}</L>{localizeText(plusCategory)}<L>{" category rate."}</L></p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Sorting & Preparation Guidelines */}
                        <DetailsDisclosure label={localizeText("Preparation tips")}>

                          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <p><L>{"Ensure items are emptied of residue and clean from food oil or moisture."}</L></p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <p><L>{"Remove non-recyclable caps, staples, or adhesive seals if separable."}</L></p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <p><L>{"Pack securely or flatten to optimize community drop-off capacity."}</L></p>
                            </div>
                          </div>
                        </DetailsDisclosure>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <BackButton onClick={() => setPlusStep(3)} />
                          <button
                            type="button"
                            onClick={() => setPlusStep(5)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"Next: Facility Review →"}</L></button>
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 5: FACILITY REVIEW ══════════ */}
                  {plusStep === 5 && plusMode === "ai" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const pickupDetailsLocked = plusSubmitting || pickupOperationStatus !== "idle";
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Collection method */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <p className="text-xs font-bold text-slate-800"><L>{"Collection method"}</L></p>
                          <div className="grid grid-cols-2 gap-2">
                            {localizeText(([
                              ["self_drop_off", "Self Drop-off"],
                              ["collector_pickup", "Collector Pickup"],
                            ] as const).map(([method, label]) => (
                              <button
                                key={method}
                                type="button"
                                aria-pressed={collectionMethod === method}
                                disabled={pickupDetailsLocked}
                                onClick={() => {
                                  setCollectionMethod(method);
                                  setPickupDetailsError("");
                                }}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                                  collectionMethod === method
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {localizeText(label)}
                              </button>
                            )))}
                          </div>
                          {localizeText(collectionMethod === "collector_pickup" && (
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                              {localizeText(pickupDetailsLocked ? (
                                <div className="space-y-1.5">
                                  <span className="block text-xs font-semibold text-slate-700"><L>{"Pickup address"}</L></span>
                                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">{localizeText(pickupAddress)}</p>
                                </div>
                              ) : (
                                <SimeDarbyAddressPicker
                                  currentAddress={pickupAddress}
                                  currentZone={epZone}
                                  onAddressChange={address => {
                                    setPickupAddress(address);
                                    setPickupDetailsError("");
                                  }}
                                  label={localizeText("Pickup address")}
                                  placeholder={localizeText("Enter or select your pickup address")}
                                  compact
                                />
                              ))}
                              <label className="block space-y-1.5">
                                <span className="text-xs font-semibold text-slate-700"><L>{"Requested pickup date"}</L></span>
                                <input
                                  type="date"
                                  min={getLocalDateInputValue()}
                                  value={pickupDate}
                                  disabled={pickupDetailsLocked}
                                  onChange={event => {
                                    setPickupDate(event.target.value);
                                    setPickupDetailsError("");
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-1.5">
                                <span className="text-xs font-semibold text-slate-700"><L>{"Requested pickup time"}</L></span>
                                <input
                                  type="time"
                                  value={pickupTime}
                                  disabled={pickupDetailsLocked}
                                  onChange={event => {
                                    setPickupTime(event.target.value);
                                    setPickupDetailsError("");
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                                />
                              </label>
                              <p className={`text-[11px] ${pickupOperationStatus === "retry_booking" ? "text-amber-800" : pickupOperationStatus === "uncertain" ? "text-red-700" : "text-slate-500"}`} role="status">
                                {localizeText(pickupOperationStatus === "retry_booking"
                                  ? "The recycling record is saved, but the pickup is not confirmed. Retry creates or safely checks only the booking; your details are retained."
                                  : pickupOperationStatus === "uncertain"
                                    ? "The recycling save may have succeeded. This operation is paused to avoid resubmitting or overwriting the record."
                                    : "Submitting saves the recycling item first, then requests a pickup booking. The booking is confirmed only after both writes succeed.")}
                              </p>
                              {localizeText(pickupDetailsError && (
                                <p className="text-[11px] text-red-700" role="alert">{localizeText(pickupDetailsError)}</p>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Nearest Eco Facility Card */}
                        {localizeText(collectionMethod === "self_drop_off" && (
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-700" />
                              <span><L>{"Nearest Sime Darby Eco Facility"}</L></span>
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"><L>{"Open · 7am - 9pm"}</L></span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-900"><L>{"Elmina Central Park Eco Station"}</L></p>
                            <p className="text-[11px] text-slate-500 mt-0.5"><L>{"Elmina Promenade, City of Elmina (0.8 km)"}</L></p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                              <span className="font-semibold text-emerald-700"><L>{"✓ RFID Smart Bin"}</L></span>
                              <span>·</span>
                              <span><L>{"✓ QR Scale Terminal"}</L></span>
                            </div>
                          </div>
                        </div>
                        ))}

                        {/* Disposal Method */}
                        {collectionMethod === "self_drop_off" && (
                          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
                            <p className="text-xs font-bold text-slate-800"><L>{"Selected Disposal Method"}</L></p>
                            <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/60 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#236B37]" />
                                <span className="text-xs font-bold text-emerald-950"><L>{"Self Drop-off at Eco Station"}</L></span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800"><L>{"Instant QR"}</L></span>
                            </div>
                            <p className="text-[10px] text-slate-500 pl-1"><L>{"Resident: "}</L><span className="font-semibold text-slate-800">{userName || "Wei En Lee"}</span> ({localizeText(epZone || "")})
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            disabled={pickupOperationStatus !== "idle"}
                            onClick={() => setPlusStep(4)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"← Back"}</L></button>
                          <button
                            type="button"
                            disabled={plusSubmitting || pickupOperationStatus === "uncertain" || (pickupOperationStatus !== "retry_booking" && collectionMethod === "collector_pickup" && (
                              !pickupAddress.trim()
                              || !isValidRequestedPickupDate(pickupDate)
                              || !isValidRequestedPickupTime(pickupTime)
                            ))}
                            onClick={() => {
                              void submitDisposedItem({
                                mode: "ai",
                                collectionMethod,
                                pickupAddress,
                                pickupDate,
                                pickupTime,
                                itemName: plusItemType,
                                materialType: `${plusCategory} - ${plusItemType}`,
                                icon: selectedCatObj.icon || "♻️",
                                bin: selectedCatObj.bin || "Blue Bin (Recyclables)",
                              });
                            }}
                            className={`flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all text-center ${plusSubmitting ? "opacity-60 cursor-wait" : "cursor-pointer active:scale-95"}`}
                          >
                            {localizeText(plusSubmitting ? "Saving..." : pickupOperationStatus === "retry_booking"
                              ? "Retry Pickup Booking →"
                              : collectionMethod === "collector_pickup"
                                ? "Submit Item & Request Pickup →"
                              : "Submit & Log Material →")}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 6: NEXT ACTION (SUCCESS & COMPLETION) ══════════ */}
                  {localizeText(plusStep === 6 && plusMode === "ai" && (() => {
                    const weightKg = parsePositiveWeightKg(plusWeight) ?? 0;
                    const pointRate = resolveMaterialPointsPerKg(plusCategory, plusItemType);
                    const pendingPoints = pointRate ? Math.floor(pointRate.points * weightKg) : null;
                    return (
                      <div className="space-y-4 text-center py-2 pb-2">
                        {/* Big Green Success Badge */}
                        <div className="icon-container w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                          <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {localizeText(collectionMethod === "collector_pickup" ? "Pickup Requested Successfully!" : "Disposal Logged Successfully!")}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                            {localizeText(collectionMethod === "collector_pickup"
                              ? "Your recycling item and pickup booking are saved. Recycling verification and points approval are still pending."
                              : "Your disposal submission is saved and pending verification.")}
                          </p>
                        </div>

                        {/* Rewards Card */}
                        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-4 text-center space-y-1">
                          <span className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-wider"><L>{"Points Pending Verification"}</L></span>
                          <p className="text-2xl font-extrabold text-[#1B5E20] tabular-nums">
                            {localizeText(pendingPoints === null ? "Rate unavailable" : `+${pendingPoints} Green Points`)}
                          </p>
                          <p className="text-[11px] text-[#2E7D32]"><L>{"Points are not credited until verification"}</L></p>
                        </div>

                        {/* Action Buttons: Navigate to Eco Station, Log Another & Done / View Activity */}
                        <div className="space-y-2 pt-2">
                          {localizeText(collectionMethod === "self_drop_off" && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Map");
                              }}
                              className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                            >
                              <Navigation className="w-4 h-4" />
                              <span><L>{"Navigate to Eco Station"}</L></span>
                            </button>
                          ))}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                imageReadIdRef.current++;
                                setPlusStep(1);
                                recycleSubmissionIdRef.current = null;
                                clearCameraSuggestion();
                                setPlusPhoto(false);
                                setPlusPhotoUrl("");
                                setPlusCategory("");
                                setPlusItemType("");
                                setPlusCondition("");
                                setPlusWeight("");
                                setPlusWeightError("");
                                resetCollectionSelection();
                              }}
                              className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                            ><L>{"+ Scan Another"}</L></button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Activity");
                                setActSection("Disposed Items");
                              }}
                              className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            ><L>{"Done / View Activity"}</L></button>
                          </div>
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ MANUAL MATERIAL GUIDE: 5-STEP LOGICAL FLOW ══════════ */}
                  {localizeText(plusStep === 1 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory);
                    const availableItemTypes = CATEGORY_ITEM_TYPES[plusCategory] || ["Bottles", "Containers", "Bags", "Packaging"];

                    // ALL columns are strictly required before Continue button can be clicked
                    const isStep1Valid = Boolean(
                      plusCategory.trim() &&
                      plusItemType.trim() &&
                      plusCondition.trim() &&
                      parsePositiveWeightKg(plusWeight) !== null
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
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider"><L>{"Category"}</L></span>
                            <div className="flex items-center gap-2">
                              {localizeText(selectedCatObj && (
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                  <span>{localizeText(selectedCatObj.icon)}</span>
                                  <span>{localizeText(selectedCatObj.name)}</span>
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={() => setCatBoxOpen(!catBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {localizeText(catBoxOpen ? "Close" : "Open")}
                              </button>
                            </div>
                          </div>

                          {localizeText(catBoxOpen && (
                            <div className="space-y-2.5 pt-0.5">
                              {/* Horizontally sliding 2-row category grid */}
                              <div
                                ref={catScrollRef}
                                onScroll={handleCatScroll}
                                className="grid grid-rows-2 grid-flow-col auto-cols-[104px] gap-2 overflow-x-auto scroll-smooth py-1 px-0.5 no-scrollbar touch-pan-x"
                                style={{ scrollSnapType: "x mandatory" }}
                              >
                                {localizeText(MANUAL_CATEGORIES.map(cat => {
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
                                      <span className="text-2xl shrink-0">{localizeText(cat.icon)}</span>
                                      <span className="text-[10.5px] font-bold leading-tight truncate max-w-[94px]">
                                        {localizeText(cat.name)}
                                      </span>
                                    </button>
                                  );
                                }))}
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
                                    aria-label={localizeText("Slide to browse all categories")}
                                  />
                                </div>

                                <span className="text-[10px] text-slate-400 font-medium"><L>{"← Slide bar to browse all "}</L>{localizeText(MANUAL_CATEGORIES.length)}<L>{" categories →"}</L></span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 2. Item Type Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider"><L>{"Item Type"}</L></span>
                            <div className="flex items-center gap-2">
                              {localizeText(plusItemType ? (
                                <span className="text-xs font-bold text-slate-900">{localizeText(plusItemType)}</span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium"><L>{"Tap to select"}</L></span>
                              ))}
                              <button
                                type="button"
                                onClick={() => setItemTypeBoxOpen(!itemTypeBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {localizeText(itemTypeBoxOpen ? "Close" : "Open")}
                              </button>
                            </div>
                          </div>

                          {localizeText(itemTypeBoxOpen && (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {localizeText(availableItemTypes.map(type => {
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
                                    {localizeText(type)}
                                  </button>
                                );
                              }))}
                            </div>
                          ))}
                        </div>

                        {/* 3. Condition Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider"><L>{"Condition"}</L></span>
                            <div className="flex items-center gap-2">
                              {localizeText(plusCondition ? (
                                <span className="text-xs font-bold text-slate-900">{localizeText(plusCondition)}</span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium"><L>{"Tap to select"}</L></span>
                              ))}
                              <button
                                type="button"
                                onClick={() => setConditionBoxOpen(!conditionBoxOpen)}
                                className="bg-[#236B37] text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-[#1b552b] transition-colors"
                              >
                                {localizeText(conditionBoxOpen ? "Close" : "Open")}
                              </button>
                            </div>
                          </div>

                          {localizeText(conditionBoxOpen && (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {localizeText(MANUAL_CONDITIONS.map(cond => {
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
                                    {localizeText(cond)}
                                  </button>
                                );
                              }))}
                            </div>
                          ))}
                        </div>

                        {/* 4. Quantity / Weight (Required) Column Card */}
                        <div className="rounded-2xl border border-slate-200/90 p-3.5 bg-white space-y-2 shadow-2xs">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span><L>{"Weight (kg)"}</L></span>
                            <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><L>{"(required)"}</L></span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={plusWeight}
                            onChange={e => {
                              setPlusWeight(e.target.value);
                              setPlusWeightError("");
                            }}
                            placeholder={localizeText("e.g. 3.5")}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#236B37] focus:ring-1 focus:ring-[#236B37]/30 transition-all shadow-2xs"
                          />
                          {localizeText((plusWeightError || (plusWeight.trim() && parsePositiveWeightKg(plusWeight) === null)) && (
                            <p className="text-[10px] text-red-700" role="alert">
                              {localizeText(plusWeightError || "Enter a positive weight in kg using numbers only (for example, 3.5).")}
                            </p>
                          ))}
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
                          ><L>{"Continue →"}</L></button>
                          {localizeText(!isStep1Valid && (
                            <p className="text-[10px] text-slate-400 text-center mt-1.5"><L>{"Please select Category, Item Type, Condition, and specify Quantity/Weight to proceed."}</L></p>
                          ))}
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 2: CONFIRM DETAILS (Screenshot 3) ══════════ */}
                  {localizeText(plusStep === 2 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Summary Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 divide-y divide-slate-100 shadow-2xs">
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Category"}</L></span>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{localizeText(selectedCatObj.icon)}</span>
                              <span>{localizeText(plusCategory)}</span>
                            </span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Item Type"}</L></span>
                            <span className="font-bold text-slate-900">{localizeText(plusItemType)}</span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Condition"}</L></span>
                            <span className="font-bold text-slate-900">{localizeText(plusCondition)}</span>
                          </div>
                          <div className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium"><L>{"Quantity / Weight"}</L></span>
                            <span className="font-bold text-slate-900">{localizeText(plusWeight)}</span>
                          </div>
                        </div>

                        {/* Green Confirmation Notice Banner */}
                        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-3 flex items-center gap-2.5 text-xs text-[#1B5E20]">
                          <CheckCircle className="w-4 h-4 text-[#2E7D32] shrink-0" />
                          <span><L>{"Please confirm the details are correct before proceeding."}</L></span>
                        </div>

                        {/* Action Buttons: Edit & Confirm */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPlusStep(1)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"Edit"}</L></button>
                          <button
                            type="button"
                            onClick={() => setPlusStep(3)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"Confirm →"}</L></button>
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 3: DISPOSAL PATH & GUIDELINES ══════════ */}
                  {localizeText(plusStep === 3 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const pointRate = resolveMaterialPointsPerKg(plusCategory, plusItemType);
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Target Sorting Stream Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider"><L>{"Designated Bin & Path"}</L></span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedCatObj.targetColor}`}>
                              {localizeText(selectedCatObj.bin)}
                            </span>
                          </div>

                          <div className="bg-[#F4F9F5] rounded-xl p-3 flex items-center gap-3">
                            <span className="text-3xl shrink-0">{localizeText(selectedCatObj.icon)}</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{localizeText(plusItemType)} ({localizeText(plusCategory)})</h4>
                              <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                {localizeText(pointRate
                                  ? `+${pointRate.points} Green Points per kg, pending verification`
                                  : "Points-per-kg rate is not defined")}
                              </p>
                              {localizeText(pointRate?.usesCategoryRate && (
                                <p className="text-[10px] text-amber-700 mt-1"><L>{"The Guide does not define a material-specific rate; this uses the existing "}</L>{localizeText(plusCategory)}<L>{" category rate."}</L></p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Preparation Guidelines */}
                        <DetailsDisclosure label={localizeText("Preparation tips")}>

                          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <p><L>{"Ensure items are emptied of residue and clean from food oil or moisture."}</L></p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <p><L>{"Remove non-recyclable caps, staples, or adhesive seals if separable."}</L></p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <p><L>{"Pack securely or flatten to optimize community drop-off capacity."}</L></p>
                            </div>
                          </div>
                        </DetailsDisclosure>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <BackButton onClick={() => setPlusStep(2)} />
                          <button
                            type="button"
                            onClick={() => setPlusStep(4)}
                            className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"Next: Facility Review →"}</L></button>
                        </div>
                      </div>
                    );
                  })())}

                  {/* ══════════ STEP 4: MANAGEMENT REVIEW ══════════ */}
                  {plusStep === 4 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const pickupDetailsLocked = plusSubmitting || pickupOperationStatus !== "idle";
                    return (
                      <div className="space-y-4 pb-2">
                        {/* Collection method */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <p className="text-xs font-bold text-slate-800"><L>{"Collection method"}</L></p>
                          <div className="grid grid-cols-2 gap-2">
                            {localizeText(([
                              ["self_drop_off", "Self Drop-off"],
                              ["collector_pickup", "Collector Pickup"],
                            ] as const).map(([method, label]) => (
                              <button
                                key={method}
                                type="button"
                                aria-pressed={collectionMethod === method}
                                disabled={pickupDetailsLocked}
                                onClick={() => {
                                  setCollectionMethod(method);
                                  setPickupDetailsError("");
                                }}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                                  collectionMethod === method
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {localizeText(label)}
                              </button>
                            )))}
                          </div>
                          {localizeText(collectionMethod === "collector_pickup" && (
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                              {localizeText(pickupDetailsLocked ? (
                                <div className="space-y-1.5">
                                  <span className="block text-xs font-semibold text-slate-700"><L>{"Pickup address"}</L></span>
                                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">{localizeText(pickupAddress)}</p>
                                </div>
                              ) : (
                                <SimeDarbyAddressPicker
                                  currentAddress={pickupAddress}
                                  currentZone={epZone}
                                  onAddressChange={address => {
                                    setPickupAddress(address);
                                    setPickupDetailsError("");
                                  }}
                                  label={localizeText("Pickup address")}
                                  placeholder={localizeText("Enter or select your pickup address")}
                                  compact
                                />
                              ))}
                              <label className="block space-y-1.5">
                                <span className="text-xs font-semibold text-slate-700"><L>{"Requested pickup date"}</L></span>
                                <input
                                  type="date"
                                  min={getLocalDateInputValue()}
                                  value={pickupDate}
                                  disabled={pickupDetailsLocked}
                                  onChange={event => {
                                    setPickupDate(event.target.value);
                                    setPickupDetailsError("");
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                                />
                              </label>
                              <label className="block space-y-1.5">
                                <span className="text-xs font-semibold text-slate-700"><L>{"Requested pickup time"}</L></span>
                                <input
                                  type="time"
                                  value={pickupTime}
                                  disabled={pickupDetailsLocked}
                                  onChange={event => {
                                    setPickupTime(event.target.value);
                                    setPickupDetailsError("");
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                                />
                              </label>
                              <p className={`text-[11px] ${pickupOperationStatus === "retry_booking" ? "text-amber-800" : pickupOperationStatus === "uncertain" ? "text-red-700" : "text-slate-500"}`} role="status">
                                {localizeText(pickupOperationStatus === "retry_booking"
                                  ? "The recycling record is saved, but the pickup is not confirmed. Retry creates or safely checks only the booking; your details are retained."
                                  : pickupOperationStatus === "uncertain"
                                    ? "The recycling save may have succeeded. This operation is paused to avoid resubmitting or overwriting the record."
                                    : "Submitting saves the recycling item first, then requests a pickup booking. The booking is confirmed only after both writes succeed.")}
                              </p>
                              {localizeText(pickupDetailsError && (
                                <p className="text-[11px] text-red-700" role="alert">{localizeText(pickupDetailsError)}</p>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Nearest Eco Facility Card */}
                        {localizeText(collectionMethod === "self_drop_off" && (
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-700" />
                              <span><L>{"Nearest Sime Darby Eco Facility"}</L></span>
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"><L>{"Open · 7am - 9pm"}</L></span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-900"><L>{"Elmina Central Park Eco Station"}</L></p>
                            <p className="text-[11px] text-slate-500 mt-0.5"><L>{"Elmina Promenade, City of Elmina (0.8 km)"}</L></p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                              <span className="font-semibold text-emerald-700"><L>{"✓ RFID Smart Bin"}</L></span>
                              <span>·</span>
                              <span><L>{"✓ QR Scale Terminal"}</L></span>
                            </div>
                          </div>
                        </div>
                        ))}

                        {/* Disposal Method */}
                        {collectionMethod === "self_drop_off" && (
                          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
                            <p className="text-xs font-bold text-slate-800"><L>{"Selected Disposal Method"}</L></p>
                            <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/60 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#236B37]" />
                                <span className="text-xs font-bold text-emerald-950"><L>{"Self Drop-off at Eco Station"}</L></span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800"><L>{"Instant QR"}</L></span>
                            </div>
                            <p className="text-[10px] text-slate-500 pl-1"><L>{"Resident: "}</L><span className="font-semibold text-slate-800">{userName || "Wei En Lee"}</span> ({localizeText(epZone || "")})
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-2.5">
                          <button
                            type="button"
                            disabled={pickupOperationStatus !== "idle"}
                            onClick={() => setPlusStep(3)}
                            className="w-1/3 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                          ><L>{"← Back"}</L></button>
                          <button
                            type="button"
                            disabled={plusSubmitting || pickupOperationStatus === "uncertain" || (pickupOperationStatus !== "retry_booking" && collectionMethod === "collector_pickup" && (
                              !pickupAddress.trim()
                              || !isValidRequestedPickupDate(pickupDate)
                              || !isValidRequestedPickupTime(pickupTime)
                            ))}
                            onClick={() => {
                              void submitDisposedItem({
                                mode: "manual",
                                collectionMethod,
                                pickupAddress,
                                pickupDate,
                                pickupTime,
                                itemName: plusItemType || (plusCategory ? `${plusCategory} Material` : "Recyclable Item"),
                                materialType: `${plusCategory} - ${plusItemType}`,
                                icon: selectedCatObj.icon || "♻️",
                                bin: selectedCatObj.bin || "Blue Bin (Recyclables)",
                              });
                            }}
                            className={`flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all text-center ${plusSubmitting ? "opacity-60 cursor-wait" : "cursor-pointer active:scale-95"}`}
                          >
                            {localizeText(plusSubmitting ? "Saving..." : pickupOperationStatus === "retry_booking"
                              ? "Retry Pickup Booking →"
                              : collectionMethod === "collector_pickup"
                                ? "Submit Item & Request Pickup →"
                              : "Submit & Log Material →")}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════ STEP 5: NEXT ACTION (SUCCESS & COMPLETION) ══════════ */}
                  {localizeText(plusStep === 5 && plusMode === "manual" && (() => {
                    const selectedCatObj = MANUAL_CATEGORIES.find(c => c.name === plusCategory) || MANUAL_CATEGORIES[1];
                    const weightKg = parsePositiveWeightKg(plusWeight) ?? 0;
                    const pointRate = resolveMaterialPointsPerKg(plusCategory, plusItemType);
                    const pendingPoints = pointRate ? Math.floor(pointRate.points * weightKg) : null;
                    return (
                      <div className="space-y-4 text-center py-2 pb-2">
                        <div className="icon-container w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                          <CheckCircle2 className="w-8 h-8 text-[#236B37]" strokeWidth={2.2} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {localizeText(collectionMethod === "collector_pickup" ? "Pickup Requested Successfully!" : "Material Classified & Logged!")}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {localizeText(collectionMethod === "collector_pickup"
                              ? "Your recycling item and pickup booking are saved. Recycling verification and points approval are still pending."
                              : <><L>{"Your "}</L><strong className="text-emerald-800">{localizeText(plusItemType)}</strong> ({localizeText(plusCategory)}<L>{") has been logged."}</L></>)}
                          </p>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full mt-2.5">
                            <span>🎁</span>
                            <span>
                              {localizeText(pendingPoints === null
                                ? "Points rate unavailable; pending points not calculated"
                                : `+${pendingPoints} Green Points Pending Verification`)}
                            </span>
                          </div>
                        </div>

                        {/* Summary Details */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500"><L>{"Classification:"}</L></span>
                            <span className="font-semibold text-slate-800">{localizeText(selectedCatObj.bin)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500"><L>{"Condition:"}</L></span>
                            <span className="font-semibold text-slate-800">{localizeText(plusCondition)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500"><L>{"Quantity / Weight:"}</L></span>
                            <span className="font-semibold text-slate-800">{localizeText(plusWeight)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 space-y-2">
                          {localizeText(collectionMethod === "self_drop_off" && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Map");
                              }}
                              className="w-full py-3.5 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                            >
                              <Navigation className="w-4 h-4" />
                              <span><L>{"Navigate to Eco Station"}</L></span>
                            </button>
                          ))}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                recycleSubmissionIdRef.current = null;
                                resetCollectionSelection();
                                setPlusCategory("Plastic");
                                setPlusItemType("");
                                setPlusCondition("");
                                setPlusWeight("");
                                setPlusWeightError("");
                                setCatBoxOpen(true);
                                setItemTypeBoxOpen(true);
                                setConditionBoxOpen(true);
                                setCatScrollProgress(0);
                                setPlusStep(1);
                              }}
                              className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                            ><L>{"Log Another Item"}</L></button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPlusModal(false);
                                setActiveTab("Activity");
                                setActSection("Disposed Items");
                              }}
                              className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            ><L>{"Done / View Activity"}</L></button>
                          </div>
                        </div>
                      </div>
                    );
                  })())}

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
                  <h2 className="text-sm font-bold text-slate-900">{localizeText(t("rep_title"))} ({localizeText(reportStep === 1 ? "Step 1/2" : "Step 2/2")})</h2>
                  <button onClick={resetReportModal} className="icon-button p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                  {reportStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">{localizeText(t("rep_issue_type"))}</label>
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
                              {localizeText(issue)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">{localizeText(t("rep_desc"))}</label>
                        <textarea
                          value={issueDesc}
                          onChange={e => setIssueDesc(e.target.value)}
                          placeholder={localizeText(t("rep_desc_ph"))}
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
                        {localizeText(t("btn_next"))} →
                      </button>
                    </div>
                  )}

                  {reportStep === 2 && (
                    <div className="space-y-3.5">
                      {/* Issue Summary Card */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
                        <div className="icon-container w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">{localizeText(issueType)}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{issueDesc}</p>
                        </div>
                      </div>

                      {/* Location Input & GPS */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block"><L>{"Incident Location"}</L></label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={reportAddress || epArea || epZone || "City of Elmina, Shah Alam"}
                              onChange={e => setReportAddress(e.target.value)}
                              placeholder={localizeText("Township or street location...")}
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
                            {localizeText(gpsActive ? "✓ Pinned" : "Pin GPS")}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-1"><L>{"Tagging GPS helps municipal collectors reach the exact bin."}</L></p>
                      </div>

                      {/* Photo Evidence Simulation */}
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="icon-container w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800"><L>{"Photo Proof Captured"}</L></p>
                            <p className="text-[10px] text-emerald-700 font-medium"><L>{"✓ evidence_photo.jpg attached"}</L></p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md"><L>{"Ready"}</L></span>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          disabled={reportSubmitting}
                          onClick={() => setReportStep(1)}
                          className={`flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all ${reportSubmitting ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                        ><L>{"← Back"}</L></button>
                        <button
                          type="button"
                          disabled={reportSubmitting}
                          onClick={async () => {
                            if (reportSubmittingRef.current) return;
                            reportSubmittingRef.current = true;
                            setReportSubmitting(true);
                            setReportSubmitError("");
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
                            try {
                              await addReportToDb(newReport);
                              reportSubmittingRef.current = false;
                              resetReportModal();
                              setActiveTab("Activity");
                              setActSection("Reports");
                              showUserToast("Report submitted successfully! Municipal team alerted.");
                            } catch (error) {
                              console.error("Could not save report:", error);
                              setReportSubmitError("Could not submit your report. Your details are still here; please try again.");
                            } finally {
                              reportSubmittingRef.current = false;
                              setReportSubmitting(false);
                            }
                          }}
                          className={`flex-2 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all ${reportSubmitting ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                        >
                          {localizeText(reportSubmitting ? "Submitting..." : t("btn_submit"))}
                        </button>
                      </div>
                      {localizeText(reportSubmitError && (
                        <p role="alert" className="mt-2 text-xs text-red-700">{localizeText(reportSubmitError)}</p>
                      ))}
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
                      <h3 className="text-sm font-bold text-slate-900">{localizeText(r.issue)}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{r.address}</p>
                    </div>
                    <span className={statusColors[r.status]}>{localizeText(r.status)}</span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                    <p className="text-xs text-slate-700 leading-relaxed">{localizeText(r.description)}</p>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mb-2">{localizeText(t("det_timeline"))}</p>
                  <div className="space-y-2 mb-4">
                    {localizeText((r.timeline || [`Submitted · ${r.time}`]).map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>{localizeText(step)}</span>
                      </div>
                    )))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailReportId(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    {localizeText(t("btn_close"))}
                  </button>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* ── Material Guide Details Modal ── */}
        <AnimatePresence>
          {localizeText(selectedGuideItem && (
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
                      {localizeText(selectedGuideItem.icon)}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight"><L>{"Material Details"}</L></h2>
                      <p className="text-[11px] text-slate-500 font-medium"><L>{"Official Sime Darby & City Municipal Guide"}</L></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideItem(null)}
                    className="icon-button p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
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
                          {localizeText(selectedGuideItem.category)}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {localizeText(selectedGuideItem.name)}
                        </h3>
                      </div>
                      <span className="text-3xl shrink-0 p-2 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
                        {localizeText(selectedGuideItem.icon)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${selectedGuideItem.binBg} ${selectedGuideItem.binColor} ${selectedGuideItem.binText}`}>
                        {localizeText(selectedGuideItem.bin)}
                      </span>
                      {localizeText(selectedGuideItem.points && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                          +{localizeText(selectedGuideItem.points)}<L>{" pts/kg Green Points"}</L></span>
                      ))}
                    </div>

                    {localizeText(selectedGuideItem.route && (
                      <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block"><L>{"Designated Facility:"}</L></span>
                          <span className="text-[11px] text-slate-500">{localizeText(selectedGuideItem.route)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Official Sorting Rule */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span><L>{"Official Sorting Rule"}</L></span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed pl-5">
                      {localizeText(selectedGuideItem.rule)}
                    </p>
                  </div>

                  {/* Preparation Steps */}
                  {localizeText(selectedGuideItem.prepSteps && selectedGuideItem.prepSteps.length > 0 && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span><L>{"Preparation Steps Before Disposal"}</L></span>
                      </h4>
                      <div className="space-y-2.5">
                        {localizeText(selectedGuideItem.prepSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {localizeText(idx + 1)}
                            </span>
                            <p className="leading-snug pt-0.5">{localizeText(step)}</p>
                          </div>
                        )))}
                      </div>
                    </div>
                  ))}

                  {/* Accepted vs Not Accepted */}
                  <div className="space-y-3">
                    {/* Accepted Items */}
                    {localizeText(selectedGuideItem.accepted && selectedGuideItem.accepted.length > 0 && (
                      <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><L>{"What is Accepted"}</L></span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700 pl-0.5">
                          {localizeText(selectedGuideItem.accepted.map((acc, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{localizeText(acc)}</span>
                            </li>
                          )))}
                        </ul>
                      </div>
                    ))}

                    {/* Not Accepted Items */}
                    {localizeText(selectedGuideItem.notAccepted && selectedGuideItem.notAccepted.length > 0 && (
                      <div className="bg-white border border-rose-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span><L>{"What is NOT Accepted (Contaminants)"}</L></span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700 pl-0.5">
                          {localizeText(selectedGuideItem.notAccepted.map((no, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{localizeText(no)}</span>
                            </li>
                          )))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Pro Tip / Environmental Impact */}
                  {localizeText(selectedGuideItem.tips && selectedGuideItem.tips.length > 0 && (
                    <div className="shine-tip rounded-2xl p-3.5 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-amber-900"><L>{"Pro Recycling Tip"}</L></p>
                        <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                          {localizeText(selectedGuideItem.tips.join(" "))}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedGuideItem(null)}
                      className="flex-1 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
                    ><L>{"Close Details"}</L></button>
                    <button
                      type="button"
                      onClick={() => {
                        if (reopenPendingPickupBooking()) return;
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
                        setPlusWeightError("");
                        resetCollectionSelection();
                        setPlusMode("manual");
                        setPlusStep(1);
                        recycleSubmissionIdRef.current = null;
                        setShowPlusModal(true);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-[#236B37] hover:bg-[#1b552b] text-white text-xs font-bold shadow-xs transition-all text-center cursor-pointer active:scale-95"
                    ><L>{"Dispose or Recycle →"}</L></button>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {localizeText(showLogoutConfirm && (
          <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
              <div className="icon-container w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3 mx-auto text-red-600">
                <LogOut className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{localizeText(t("logout_title"))}</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">{localizeText(t("logout_body"))}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {localizeText(t("logout_cancel"))}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOut(auth).catch(() => {});
                    setDemoSession(false); demoModeRef.current=false; setDemoMode(false);
                    setLoggedIn(false);
                    setIsAdmin(false);
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  {localizeText(t("logout_confirm"))}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* ── Set Collection Reminder Modal ── */}
        <AnimatePresence>
          {localizeText(showReminderPicker && (() => {
            const nearest = [...schedules].sort((a,b) => schedSortKey(a).localeCompare(schedSortKey(b)))[0];
            return <ReminderDialog title={localizeText(t("reminder_title"))} subtitle={localizeText(t("reminder_subtitle"))}
              collection={nearest ? `${nearest.day}, ${nearest.date} ${nearest.month ?? ""} · ${nearest.time}` : "No collection scheduled"}
              zone={nearest ? `${nearest.zone} — ${nearest.type}` : "Check back for the next collection."}
              options={[{id:"5m",label:translations.en.reminder_5m},{id:"30m",label:translations.en.reminder_30m},{id:"1h",label:translations.en.reminder_1h},
                {id:"3h",label:translations.en.reminder_3h},{id:"1d",label:translations.en.reminder_1d},{id:"2d",label:translations.en.reminder_2d}]}
              value={reminderChoice} enabled={reminderSet} closeLabel={localizeText(t("btn_close"))} removeLabel={localizeText(t("reminder_remove"))}
              onClose={() => setShowReminderPicker(false)} onSave={value => {setReminderSet(true); setReminderChoice(value); setShowReminderPicker(false); showUserToast(`Reminder preference saved: ${value}.`);}}
              onRemove={() => {setReminderSet(false); setReminderChoice(""); setShowReminderPicker(false); showUserToast("Collection reminder removed.");}} />;
          })())}
        </AnimatePresence>

        {/* ── Interactive In-App Navigation Modal ── */}
        <AnimatePresence>
          {navigateLocation !== null && (() => {
            const loc = bins.find(bin => bin.id === navigateLocation.id) ?? navigateLocation;
            const locLat = (loc as any).lat || 3.1868;
            const locLng = (loc as any).lng || 101.5042;
            const locAddr = (loc as any).address || (loc as any).township || "Sime Darby Property Township";
            const fc = loc.fill === undefined ? null : fillColor(loc.fill);
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
                      <div className="icon-container w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{localizeText(loc.name)}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{localizeText(loc.distance)} · {localizeText(loc.township || "Selangor")}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNavigateLocation(null)}
                      className="icon-button p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── PHASE 1: SELECT TRANSPORT & ROUTE OVERVIEW ── */}
                  {localizeText(navPhase === "select" && (
                    <div className="space-y-4 pt-3">
                      {/* Destination Details Card */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                            {localizeText(loc.type || "Eco Station")}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {localizeText(loc.operatingHours || "Open Daily")}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{localizeText(locAddr)}</p>

                        {/* Capacity Level */}
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                            <span><L>{"Bin Capacity"}</L></span>
                            <span className="font-bold tabular-nums" style={{ color: fc?.dot }}>{loc.fill === undefined ? <L>{binCapacityState === "loading" ? "Loading capacity…" : loc.capacityStale ? "Capacity reading is outdated" : "Capacity unavailable"}</L> : <>{localizeText(loc.fill)}<L>{"% Full"}</L></>}</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            {loc.fill !== undefined && <div className={`h-full rounded-full ${fc?.bar}`} style={{ width: `${loc.fill}%` }} />}
                          </div>
                        </div>

                        {/* Accepted Materials */}
                        {localizeText((loc as any).acceptedMaterials && (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {localizeText((loc as any).acceptedMaterials.map((mat: string) => (
                              <span key={mat} className="text-[10px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                                {localizeText(mat)}
                              </span>
                            )))}
                          </div>
                        ))}
                      </div>

                      {/* Mode of Transport Selector */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block"><L>{"Select Transport Mode"}</L></label>
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
                            <div className={`icon-container w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${navTransport === "drive" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold"><L>{"Driving"}</L></p>
                              <p className="text-[10px] text-slate-500 font-medium">~{localizeText(Math.max(2, Math.round(parseFloat(loc.distance) * 3 || 3)))}<L>{" mins"}</L></p>
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
                            <div className={`icon-container w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${navTransport === "walk" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                              <Footprints className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold"><L>{"Walking"}</L></p>
                              <p className="text-[10px] text-slate-500 font-medium">~{localizeText(Math.max(5, Math.round(parseFloat(loc.distance) * 14 || 12)))}<L>{" mins"}</L></p>
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
                          <span><L>{"Start Live Navigation"}</L></span>
                        </button>

                        <a
                          href={getGoogleMapsNavigationUrl(locLat, locLng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                        >
                          <ExternalLink className="w-4 h-4 text-emerald-700" />
                          <span><L>{"Open in External Google Maps"}</L></span>
                        </a>
                      </div>
                    </div>
                  ))}

                  {/* ── PHASE 2: ACTIVE TURN-BY-TURN GUIDANCE ── */}
                  {localizeText(navPhase === "active" && (
                    <div className="space-y-4 pt-3">
                      {/* High-visibility Maneuver Card */}
                      <div className="bg-gradient-to-br from-[#133E26] to-[#15803D] text-white rounded-3xl p-4 shadow-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                            {localizeText(currentStep.icon === "left" ? (
                              <CornerUpLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
                            ) : currentStep.icon === "right" ? (
                              <CornerUpRight className="w-7 h-7 text-white" strokeWidth={2.5} />
                            ) : currentStep.icon === "arrive" ? (
                              <MapPin className="w-7 h-7 text-amber-300" strokeWidth={2.5} />
                            ) : (
                              <ArrowUp className="w-7 h-7 text-white" strokeWidth={2.5} />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            {localizeText(currentStep.dist && (
                              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block"><L>{"In "}</L>{localizeText(currentStep.dist)}
                              </span>
                            ))}
                            <h4 className="text-base font-extrabold tracking-tight leading-snug">
                              {localizeText(currentStep.label)}
                            </h4>
                            <p className="text-xs text-emerald-100/90 mt-0.5">
                              {localizeText(currentStep.road)}
                            </p>
                          </div>
                        </div>

                        {/* Next preview step */}
                        {localizeText(nextStep && (
                          <div className="pt-2 border-t border-white/15 flex items-center gap-2 text-xs text-emerald-100">
                            <span className="text-[10px] uppercase font-bold text-emerald-200"><L>{"Then:"}</L></span>
                            <span className="truncate">{localizeText(nextStep.label)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Progress and Step Status */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span><L>{"Step "}</L>{localizeText(navStep + 1)}<L>{" of "}</L>{localizeText(steps.length)}</span>
                          <span className="text-emerald-700 font-bold tabular-nums">
                            {localizeText(Math.round(((navStep + 1) / steps.length) * 100))}<L>{"% completed"}</L></span>
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
                        {localizeText(!isLastStep ? (
                          <button
                            type="button"
                            onClick={() => setNavStep(s => s + 1)}
                            className="w-full py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span><L>{"Next Step →"}</L></span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNavPhase("arrived")}
                            className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                            <span><L>{"I Have Arrived!"}</L></span>
                          </button>
                        ))}

                        <div className="flex gap-2">
                          <a
                            href={getGoogleMapsNavigationUrl(locLat, locLng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span><L>{"Google Maps"}</L></span>
                          </a>

                          <button
                            type="button"
                            onClick={() => { setNavPhase("select"); setNavStep(0); }}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                          ><L>{"Exit Navigation"}</L></button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ── PHASE 3: ARRIVED AT STATION ── */}
                  {localizeText(navPhase === "arrived" && (
                    <div className="space-y-4 pt-4 text-center">
                      <div className="icon-container w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                        <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded"><L>{"Destination Reached"}</L></span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-1"><L>{"You Have Arrived!"}</L></h4>
                        <p className="text-xs text-slate-600 mt-0.5 max-w-xs mx-auto">
                          {localizeText(loc.name)}<L>{" is ready. Deposit your separated recyclables to earn green points."}</L></p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-medium"><L>{"🎁 Earn "}</L><strong className="text-emerald-800">+{localizeText(loc.pointsPerKg || 15)}<L>{" Green Points"}</L></strong><L>{" per kilogram recycled today!"}</L></div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (reopenPendingPickupBooking()) return;
                            setNavigateLocation(null);
                            recycleSubmissionIdRef.current = null;
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
                          <span><L>{"Log Recycled Items Now"}</L></span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNavigateLocation(null)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                        ><L>{"Done / Back to Map"}</L></button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        <AnimatePresence>
          {localizeText(qrReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6"
              onClick={() => setQrReward(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="voucher-qr-title"
                className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
                onClick={event => event.stopPropagation()}
              >
                <h2 id="voucher-qr-title" className="text-base font-bold text-slate-900">
                  {localizeText(qrReward.name)}
                </h2>
                <div className="mx-auto my-5 w-56 rounded-2xl border border-slate-200 bg-white p-3">
                  <QRCodeSVG
                    value={qrReward.code}
                    size={208}
                    level="M"
                    includeMargin
                    aria-label={localizeText(`Voucher QR code for ${qrReward.name}`)}
                  />
                </div>
                <p className="text-xs text-slate-500"><L>{"Voucher code"}</L></p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{localizeText(qrReward.code)}</p>
                <button
                  type="button"
                  onClick={() => setQrReward(null)}
                  className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                ><L>{"Close"}</L></button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Global Interactive Toast ── */}
        <AnimatePresence>
          {localizeText(userToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-14 left-4 right-4 z-60 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md border border-slate-700"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.2} />
              <span className="text-xs font-semibold flex-1 leading-snug">{localizeText(userToast)}</span>
            </motion.div>
          ))}
        </AnimatePresence>

      </div>
    </div>
  );
}
