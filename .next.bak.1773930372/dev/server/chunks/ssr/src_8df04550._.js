module.exports = [
"[project]/src/lib/types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ─── Firearm Types ─────────────────────────────────────────────
__turbopack_context__.s([
    "BULLET_TYPES",
    ()=>BULLET_TYPES,
    "COMMON_CALIBERS",
    ()=>COMMON_CALIBERS,
    "FIREARM_TYPES",
    ()=>FIREARM_TYPES,
    "FIREARM_TYPE_LABELS",
    ()=>FIREARM_TYPE_LABELS,
    "SLOTS_BY_FIREARM_TYPE",
    ()=>SLOTS_BY_FIREARM_TYPE,
    "SLOT_TYPES",
    ()=>SLOT_TYPES,
    "SLOT_TYPE_LABELS",
    ()=>SLOT_TYPE_LABELS,
    "TRANSACTION_TYPES",
    ()=>TRANSACTION_TYPES,
    "TRANSACTION_TYPE_LABELS",
    ()=>TRANSACTION_TYPE_LABELS
]);
const FIREARM_TYPES = [
    "PISTOL",
    "RIFLE",
    "SHOTGUN",
    "SMG",
    "PCC",
    "REVOLVER",
    "BOLT_ACTION",
    "LEVER_ACTION"
];
const FIREARM_TYPE_LABELS = {
    PISTOL: "Pistol",
    RIFLE: "Rifle",
    SHOTGUN: "Shotgun",
    SMG: "SMG",
    PCC: "PCC",
    REVOLVER: "Revolver",
    BOLT_ACTION: "Bolt Action",
    LEVER_ACTION: "Lever Action"
};
const SLOT_TYPES = [
    "MUZZLE",
    "BARREL",
    "BARREL_NUT",
    "HANDGUARD",
    "GAS_BLOCK",
    "GAS_TUBE",
    "BCG",
    "STOCK",
    "PISTOL_BRACE",
    "BUFFER_TUBE",
    "BUFFER",
    "BUFFER_SPRING",
    "GRIP",
    "OPTIC",
    "OPTIC_MOUNT",
    "UNDERBARREL",
    "MAGAZINE",
    "MAGWELL",
    "LIGHT",
    "LASER",
    "CHARGING_HANDLE",
    "LOWER_RECEIVER",
    "UPPER_RECEIVER",
    "LOWER_PARTS_KIT",
    "TRIGGER",
    "HAMMER",
    "DISCONNECTOR",
    "SAFETY_SELECTOR",
    "BOLT_CATCH",
    "MAGAZINE_CATCH",
    "TRIGGER_GUARD",
    "SLIDE",
    "FRAME",
    "SUPPRESSOR",
    "BIPOD",
    "SLING",
    "COMPENSATOR"
];
const SLOT_TYPE_LABELS = {
    MUZZLE: "Muzzle",
    BARREL: "Barrel",
    BARREL_NUT: "Barrel Nut",
    HANDGUARD: "Handguard",
    GAS_BLOCK: "Gas Block",
    GAS_TUBE: "Gas Tube",
    BCG: "BCG",
    STOCK: "Stock",
    PISTOL_BRACE: "Pistol Brace",
    BUFFER_TUBE: "Buffer Tube",
    BUFFER: "Buffer",
    BUFFER_SPRING: "Buffer Spring",
    GRIP: "Grip",
    OPTIC: "Optic",
    OPTIC_MOUNT: "Optic Mount",
    UNDERBARREL: "Underbarrel",
    MAGAZINE: "Magazine",
    MAGWELL: "Magwell",
    LIGHT: "Light",
    LASER: "Laser",
    CHARGING_HANDLE: "Charging Handle",
    LOWER_RECEIVER: "Lower Receiver",
    UPPER_RECEIVER: "Upper Receiver",
    LOWER_PARTS_KIT: "Lower Parts Kit",
    TRIGGER: "Trigger",
    HAMMER: "Hammer",
    DISCONNECTOR: "Disconnector",
    SAFETY_SELECTOR: "Safety Selector",
    BOLT_CATCH: "Bolt Catch",
    MAGAZINE_CATCH: "Magazine Catch",
    TRIGGER_GUARD: "Trigger Guard",
    SLIDE: "Slide",
    FRAME: "Frame",
    SUPPRESSOR: "Suppressor",
    BIPOD: "Bipod",
    SLING: "Sling",
    COMPENSATOR: "Compensator"
};
const SLOTS_BY_FIREARM_TYPE = {
    RIFLE: [
        "MUZZLE",
        "BARREL",
        "BARREL_NUT",
        "HANDGUARD",
        "GAS_BLOCK",
        "GAS_TUBE",
        "BCG",
        "STOCK",
        "PISTOL_BRACE",
        "BUFFER_TUBE",
        "BUFFER",
        "BUFFER_SPRING",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "UNDERBARREL",
        "MAGAZINE",
        "MAGWELL",
        "LIGHT",
        "LASER",
        "CHARGING_HANDLE",
        "LOWER_RECEIVER",
        "UPPER_RECEIVER",
        "LOWER_PARTS_KIT",
        "TRIGGER",
        "HAMMER",
        "DISCONNECTOR",
        "SAFETY_SELECTOR",
        "BOLT_CATCH",
        "MAGAZINE_CATCH",
        "TRIGGER_GUARD",
        "SUPPRESSOR",
        "BIPOD",
        "SLING",
        "COMPENSATOR"
    ],
    PISTOL: [
        "MUZZLE",
        "BARREL",
        "SLIDE",
        "FRAME",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "MAGAZINE",
        "MAGWELL",
        "LIGHT",
        "LASER",
        "TRIGGER",
        "SUPPRESSOR",
        "COMPENSATOR"
    ],
    SHOTGUN: [
        "MUZZLE",
        "BARREL",
        "STOCK",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "UNDERBARREL",
        "MAGAZINE",
        "LIGHT",
        "LASER",
        "TRIGGER",
        "SLING",
        "COMPENSATOR"
    ],
    SMG: [
        "MUZZLE",
        "BARREL",
        "HANDGUARD",
        "GAS_BLOCK",
        "GAS_TUBE",
        "BCG",
        "STOCK",
        "BUFFER_TUBE",
        "BUFFER",
        "BUFFER_SPRING",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "UNDERBARREL",
        "MAGAZINE",
        "MAGWELL",
        "LIGHT",
        "LASER",
        "CHARGING_HANDLE",
        "LOWER_PARTS_KIT",
        "TRIGGER",
        "HAMMER",
        "DISCONNECTOR",
        "SAFETY_SELECTOR",
        "BOLT_CATCH",
        "MAGAZINE_CATCH",
        "TRIGGER_GUARD",
        "SUPPRESSOR",
        "SLING",
        "COMPENSATOR"
    ],
    PCC: [
        "MUZZLE",
        "BARREL",
        "BARREL_NUT",
        "HANDGUARD",
        "GAS_BLOCK",
        "GAS_TUBE",
        "BCG",
        "STOCK",
        "PISTOL_BRACE",
        "BUFFER_TUBE",
        "BUFFER",
        "BUFFER_SPRING",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "UNDERBARREL",
        "MAGAZINE",
        "MAGWELL",
        "LIGHT",
        "LASER",
        "CHARGING_HANDLE",
        "LOWER_PARTS_KIT",
        "TRIGGER",
        "HAMMER",
        "DISCONNECTOR",
        "SAFETY_SELECTOR",
        "BOLT_CATCH",
        "MAGAZINE_CATCH",
        "TRIGGER_GUARD",
        "SUPPRESSOR",
        "SLING",
        "COMPENSATOR"
    ],
    REVOLVER: [
        "BARREL",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "TRIGGER",
        "COMPENSATOR"
    ],
    BOLT_ACTION: [
        "MUZZLE",
        "BARREL",
        "STOCK",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "MAGAZINE",
        "TRIGGER",
        "BIPOD",
        "SLING",
        "SUPPRESSOR"
    ],
    LEVER_ACTION: [
        "MUZZLE",
        "BARREL",
        "STOCK",
        "GRIP",
        "OPTIC",
        "OPTIC_MOUNT",
        "TRIGGER",
        "SLING"
    ]
};
const TRANSACTION_TYPES = [
    "PURCHASE",
    "RANGE_USE",
    "TRANSFER_OUT",
    "INVENTORY_CORRECTION",
    "EXPENDED"
];
const TRANSACTION_TYPE_LABELS = {
    PURCHASE: "Purchase",
    RANGE_USE: "Range Use",
    TRANSFER_OUT: "Transfer Out",
    INVENTORY_CORRECTION: "Inventory Correction",
    EXPENDED: "Expended"
};
const COMMON_CALIBERS = [
    "9mm Luger",
    ".45 ACP",
    ".40 S&W",
    ".380 ACP",
    "10mm Auto",
    ".357 Magnum",
    ".38 Special",
    ".44 Magnum",
    "5.56x45mm NATO",
    ".223 Remington",
    ".308 Winchester",
    "7.62x39mm",
    ".300 BLK",
    "6.5 Creedmoor",
    ".243 Winchester",
    ".30-06 Springfield",
    "12 Gauge",
    "20 Gauge",
    ".410 Bore",
    ".22 LR",
    ".17 HMR",
    ".22 WMR"
];
const BULLET_TYPES = [
    "FMJ",
    "HP",
    "JHP",
    "OTM",
    "Frangible",
    "Tracer",
    "Subsonic",
    "Soft Point",
    "Match",
    "Other"
];
}),
"[project]/src/lib/configurator/slot-positions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SLOT_POSITIONS",
    ()=>SLOT_POSITIONS
]);
const SLOT_POSITIONS = {
    RIFLE: {
        MUZZLE: {
            x: 4,
            y: 46
        },
        BARREL: {
            x: 20,
            y: 43
        },
        BARREL_NUT: {
            x: 39,
            y: 43
        },
        HANDGUARD: {
            x: 33,
            y: 44
        },
        GAS_BLOCK: {
            x: 28,
            y: 35
        },
        GAS_TUBE: {
            x: 38,
            y: 32
        },
        BCG: {
            x: 54,
            y: 40
        },
        OPTIC: {
            x: 47,
            y: 22
        },
        CHARGING_HANDLE: {
            x: 60,
            y: 38
        },
        STOCK: {
            x: 82,
            y: 44
        },
        PISTOL_BRACE: {
            x: 82,
            y: 44
        },
        BUFFER_TUBE: {
            x: 74,
            y: 44
        },
        BUFFER: {
            x: 77,
            y: 38
        },
        BUFFER_SPRING: {
            x: 80,
            y: 38
        },
        MAGAZINE: {
            x: 52,
            y: 70
        },
        MAGWELL: {
            x: 50,
            y: 64
        },
        GRIP: {
            x: 64,
            y: 62
        },
        UNDERBARREL: {
            x: 33,
            y: 65
        },
        LIGHT: {
            x: 28,
            y: 65
        },
        LASER: {
            x: 23,
            y: 65
        },
        SUPPRESSOR: {
            x: 2,
            y: 44
        },
        LOWER_RECEIVER: {
            x: 60,
            y: 52
        },
        UPPER_RECEIVER: {
            x: 50,
            y: 40
        },
        LOWER_PARTS_KIT: {
            x: 63,
            y: 60
        },
        TRIGGER: {
            x: 58,
            y: 54
        },
        HAMMER: {
            x: 55,
            y: 48
        },
        DISCONNECTOR: {
            x: 61,
            y: 48
        },
        SAFETY_SELECTOR: {
            x: 65,
            y: 50
        },
        BOLT_CATCH: {
            x: 56,
            y: 60
        },
        MAGAZINE_CATCH: {
            x: 53,
            y: 66
        },
        TRIGGER_GUARD: {
            x: 58,
            y: 62
        },
        BIPOD: {
            x: 30,
            y: 72
        },
        SLING: {
            x: 50,
            y: 60
        },
        COMPENSATOR: {
            x: 4,
            y: 46
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 28
        }
    },
    PISTOL: {
        MUZZLE: {
            x: 5,
            y: 48
        },
        BARREL: {
            x: 28,
            y: 43
        },
        SLIDE: {
            x: 38,
            y: 36
        },
        FRAME: {
            x: 50,
            y: 62
        },
        GRIP: {
            x: 58,
            y: 66
        },
        OPTIC: {
            x: 42,
            y: 18
        },
        OPTIC_MOUNT: {
            x: 42,
            y: 24
        },
        MAGAZINE: {
            x: 56,
            y: 78
        },
        LIGHT: {
            x: 25,
            y: 66
        },
        LASER: {
            x: 22,
            y: 66
        },
        TRIGGER: {
            x: 52,
            y: 54
        },
        SUPPRESSOR: {
            x: 2,
            y: 46
        },
        COMPENSATOR: {
            x: 5,
            y: 48
        }
    },
    SHOTGUN: {
        MUZZLE: {
            x: 4,
            y: 46
        },
        BARREL: {
            x: 20,
            y: 43
        },
        HANDGUARD: {
            x: 33,
            y: 44
        },
        OPTIC: {
            x: 47,
            y: 22
        },
        STOCK: {
            x: 82,
            y: 44
        },
        MAGAZINE: {
            x: 52,
            y: 70
        },
        GRIP: {
            x: 64,
            y: 62
        },
        UNDERBARREL: {
            x: 33,
            y: 65
        },
        LIGHT: {
            x: 28,
            y: 65
        },
        LASER: {
            x: 23,
            y: 65
        },
        SUPPRESSOR: {
            x: 2,
            y: 44
        },
        TRIGGER: {
            x: 58,
            y: 54
        },
        SLING: {
            x: 50,
            y: 60
        },
        COMPENSATOR: {
            x: 4,
            y: 46
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 28
        }
    },
    SMG: {
        MUZZLE: {
            x: 5,
            y: 46
        },
        BARREL: {
            x: 22,
            y: 43
        },
        HANDGUARD: {
            x: 34,
            y: 44
        },
        OPTIC: {
            x: 47,
            y: 22
        },
        CHARGING_HANDLE: {
            x: 60,
            y: 38
        },
        STOCK: {
            x: 80,
            y: 44
        },
        MAGAZINE: {
            x: 52,
            y: 70
        },
        GRIP: {
            x: 63,
            y: 62
        },
        UNDERBARREL: {
            x: 32,
            y: 65
        },
        LIGHT: {
            x: 27,
            y: 65
        },
        LASER: {
            x: 22,
            y: 65
        },
        SUPPRESSOR: {
            x: 2,
            y: 44
        },
        TRIGGER: {
            x: 57,
            y: 54
        },
        SLING: {
            x: 50,
            y: 60
        },
        COMPENSATOR: {
            x: 5,
            y: 46
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 28
        }
    },
    PCC: {
        MUZZLE: {
            x: 4,
            y: 46
        },
        BARREL: {
            x: 20,
            y: 43
        },
        BARREL_NUT: {
            x: 39,
            y: 43
        },
        HANDGUARD: {
            x: 33,
            y: 44
        },
        GAS_BLOCK: {
            x: 28,
            y: 35
        },
        GAS_TUBE: {
            x: 38,
            y: 32
        },
        BCG: {
            x: 54,
            y: 40
        },
        OPTIC: {
            x: 47,
            y: 22
        },
        CHARGING_HANDLE: {
            x: 60,
            y: 38
        },
        STOCK: {
            x: 82,
            y: 44
        },
        PISTOL_BRACE: {
            x: 82,
            y: 44
        },
        BUFFER_TUBE: {
            x: 74,
            y: 44
        },
        BUFFER: {
            x: 77,
            y: 38
        },
        BUFFER_SPRING: {
            x: 80,
            y: 38
        },
        MAGAZINE: {
            x: 52,
            y: 70
        },
        MAGWELL: {
            x: 50,
            y: 64
        },
        GRIP: {
            x: 64,
            y: 62
        },
        UNDERBARREL: {
            x: 33,
            y: 65
        },
        LIGHT: {
            x: 28,
            y: 65
        },
        LASER: {
            x: 23,
            y: 65
        },
        SUPPRESSOR: {
            x: 2,
            y: 44
        },
        LOWER_PARTS_KIT: {
            x: 63,
            y: 60
        },
        TRIGGER: {
            x: 58,
            y: 54
        },
        HAMMER: {
            x: 55,
            y: 48
        },
        DISCONNECTOR: {
            x: 61,
            y: 48
        },
        SAFETY_SELECTOR: {
            x: 65,
            y: 50
        },
        BOLT_CATCH: {
            x: 56,
            y: 60
        },
        MAGAZINE_CATCH: {
            x: 53,
            y: 66
        },
        TRIGGER_GUARD: {
            x: 58,
            y: 62
        },
        SLING: {
            x: 50,
            y: 60
        },
        COMPENSATOR: {
            x: 4,
            y: 46
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 28
        }
    },
    REVOLVER: {
        BARREL: {
            x: 25,
            y: 43
        },
        GRIP: {
            x: 60,
            y: 70
        },
        OPTIC: {
            x: 40,
            y: 18
        },
        OPTIC_MOUNT: {
            x: 40,
            y: 24
        },
        TRIGGER: {
            x: 52,
            y: 56
        },
        COMPENSATOR: {
            x: 5,
            y: 48
        }
    },
    BOLT_ACTION: {
        MUZZLE: {
            x: 4,
            y: 46
        },
        BARREL: {
            x: 20,
            y: 43
        },
        STOCK: {
            x: 76,
            y: 50
        },
        GRIP: {
            x: 62,
            y: 60
        },
        OPTIC: {
            x: 47,
            y: 20
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 27
        },
        MAGAZINE: {
            x: 52,
            y: 68
        },
        TRIGGER: {
            x: 57,
            y: 54
        },
        BIPOD: {
            x: 25,
            y: 72
        },
        SLING: {
            x: 50,
            y: 58
        },
        SUPPRESSOR: {
            x: 2,
            y: 44
        }
    },
    LEVER_ACTION: {
        MUZZLE: {
            x: 4,
            y: 46
        },
        BARREL: {
            x: 20,
            y: 43
        },
        STOCK: {
            x: 80,
            y: 48
        },
        GRIP: {
            x: 62,
            y: 58
        },
        OPTIC: {
            x: 47,
            y: 22
        },
        OPTIC_MOUNT: {
            x: 47,
            y: 28
        },
        TRIGGER: {
            x: 55,
            y: 54
        },
        SLING: {
            x: 50,
            y: 60
        }
    }
};
}),
"[project]/src/lib/configurator/slot-icons.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SLOT_ICONS",
    ()=>SLOT_ICONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crosshair.js [app-ssr] (ecmascript) <export default as Crosshair>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$justify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignJustify$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/text-align-justify.js [app-ssr] (ecmascript) <export default as AlignJustify>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/hand.js [app-ssr] (ecmascript) <export default as Hand>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-ssr] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Scan$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/scan.js [app-ssr] (ecmascript) <export default as Scan>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-ssr] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left-right.js [app-ssr] (ecmascript) <export default as ArrowLeftRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-ssr] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link.js [app-ssr] (ecmascript) <export default as Link>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wind$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wind$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wind.js [app-ssr] (ecmascript) <export default as Wind>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/cog.js [app-ssr] (ecmascript) <export default as Cog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$toggle$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ToggleLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/toggle-left.js [app-ssr] (ecmascript) <export default as ToggleLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sliders$2d$horizontal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SlidersHorizontal$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sliders-horizontal.js [app-ssr] (ecmascript) <export default as SlidersHorizontal>");
;
const SLOT_ICONS = {
    OPTIC: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__["Crosshair"],
        color: "#00C2FF"
    },
    OPTIC_MOUNT: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__["Crosshair"],
        color: "#00C2FF"
    },
    BARREL: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"],
        color: "#8B9DB0"
    },
    BARREL_NUT: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__["Cog"],
        color: "#8B9DB0"
    },
    UPPER_RECEIVER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"],
        color: "#8B9DB0"
    },
    MUZZLE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"],
        color: "#F5A623"
    },
    COMPENSATOR: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"],
        color: "#F5A623"
    },
    SUPPRESSOR: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"],
        color: "#F5A623"
    },
    GAS_BLOCK: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wind$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wind$3e$__["Wind"],
        color: "#8B9DB0"
    },
    GAS_TUBE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wind$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wind$3e$__["Wind"],
        color: "#8B9DB0"
    },
    BCG: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
        color: "#00C853"
    },
    STOCK: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$justify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignJustify$3e$__["AlignJustify"],
        color: "#8B9DB0"
    },
    PISTOL_BRACE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$justify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignJustify$3e$__["AlignJustify"],
        color: "#8B9DB0"
    },
    BUFFER_TUBE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$justify$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignJustify$3e$__["AlignJustify"],
        color: "#8B9DB0"
    },
    BUFFER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
        color: "#8B9DB0"
    },
    BUFFER_SPRING: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__["Cog"],
        color: "#8B9DB0"
    },
    GRIP: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__["Hand"],
        color: "#8B9DB0"
    },
    FRAME: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Hand$3e$__["Hand"],
        color: "#8B9DB0"
    },
    MAGAZINE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
        color: "#F5A623"
    },
    MAGWELL: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
        color: "#8B9DB0"
    },
    LIGHT: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"],
        color: "#F5A623"
    },
    LASER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Scan$3e$__["Scan"],
        color: "#00C2FF"
    },
    UNDERBARREL: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"],
        color: "#8B9DB0"
    },
    BIPOD: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"],
        color: "#8B9DB0"
    },
    TRIGGER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
        color: "#8B9DB0"
    },
    HAMMER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
        color: "#8B9DB0"
    },
    DISCONNECTOR: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__["Cog"],
        color: "#8B9DB0"
    },
    SAFETY_SELECTOR: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$toggle$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ToggleLeft$3e$__["ToggleLeft"],
        color: "#F5A623"
    },
    BOLT_CATCH: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sliders$2d$horizontal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SlidersHorizontal$3e$__["SlidersHorizontal"],
        color: "#8B9DB0"
    },
    MAGAZINE_CATCH: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sliders$2d$horizontal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SlidersHorizontal$3e$__["SlidersHorizontal"],
        color: "#8B9DB0"
    },
    TRIGGER_GUARD: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
        color: "#8B9DB0"
    },
    LOWER_PARTS_KIT: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
        color: "#00C853"
    },
    CHARGING_HANDLE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
        color: "#8B9DB0"
    },
    SLIDE: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__["ArrowLeftRight"],
        color: "#8B9DB0"
    },
    LOWER_RECEIVER: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
        color: "#8B9DB0"
    },
    HANDGUARD: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
        color: "#8B9DB0"
    },
    SLING: {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__["Link"],
        color: "#8B9DB0"
    }
};
}),
"[project]/src/app/vault/[id]/builds/[buildId]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BuildConfiguratorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-ssr] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crosshair.js [app-ssr] (ecmascript) <export default as Crosshair>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-ssr] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/types.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$positions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/configurator/slot-positions.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$icons$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/configurator/slot-icons.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const FIELD_CLASS = "w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint";
const SLOT_GROUPS = [
    {
        key: "CORE",
        label: "Core Components",
        slotTypes: [
            "BARREL",
            "BARREL_NUT",
            "HANDGUARD",
            "GAS_BLOCK",
            "GAS_TUBE",
            "BCG",
            "LOWER_RECEIVER",
            "UPPER_RECEIVER",
            "SLIDE",
            "FRAME",
            "LOWER_PARTS_KIT"
        ]
    },
    {
        key: "CONTROLS",
        label: "Controls & Action",
        slotTypes: [
            "TRIGGER",
            "HAMMER",
            "DISCONNECTOR",
            "SAFETY_SELECTOR",
            "BOLT_CATCH",
            "MAGAZINE_CATCH",
            "TRIGGER_GUARD",
            "CHARGING_HANDLE",
            "BUFFER",
            "BUFFER_SPRING",
            "BUFFER_TUBE"
        ]
    },
    {
        key: "ERGONOMICS",
        label: "Ergonomics",
        slotTypes: [
            "STOCK",
            "PISTOL_BRACE",
            "GRIP",
            "MAGWELL",
            "MAGAZINE"
        ]
    },
    {
        key: "AIMING",
        label: "Sighting & Aim",
        slotTypes: [
            "OPTIC",
            "OPTIC_MOUNT"
        ]
    },
    {
        key: "SUPPORT",
        label: "Muzzle & Support",
        slotTypes: [
            "MUZZLE",
            "SUPPRESSOR",
            "COMPENSATOR",
            "UNDERBARREL",
            "LIGHT",
            "LASER",
            "BIPOD",
            "SLING"
        ]
    }
];
function isCustomSlotType(slotType) {
    return slotType.startsWith("CUSTOM:");
}
function parseCustomSlot(slotType) {
    if (!isCustomSlotType(slotType)) return null;
    const rest = slotType.slice("CUSTOM:".length);
    const splitIdx = rest.indexOf("|");
    if (splitIdx === -1) {
        return {
            category: null,
            name: rest.trim()
        };
    }
    return {
        category: rest.slice(0, splitIdx).trim() || null,
        name: rest.slice(splitIdx + 1).trim()
    };
}
function getCustomSlotLabel(slotType) {
    const parsed = parseCustomSlot(slotType);
    return parsed?.name || "Custom Slot";
}
function AccessoryEditModal({ accessory, onClose, onSaved }) {
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: accessory.name,
        manufacturer: accessory.manufacturer,
        model: accessory.model ?? "",
        caliber: accessory.caliber ?? "",
        purchasePrice: accessory.purchasePrice != null ? String(accessory.purchasePrice) : "",
        imageUrl: accessory.imageUrl ?? "",
        notes: accessory.notes ?? "",
        hasBattery: accessory.hasBattery ?? false,
        batteryType: accessory.batteryType ?? "",
        batteryReplacementIntervalDays: accessory.batteryReplacementIntervalDays != null ? String(accessory.batteryReplacementIntervalDays) : "",
        lastBatteryChangeDate: accessory.lastBatteryChangeDate ? new Date(accessory.lastBatteryChangeDate).toISOString().split("T")[0] : "",
        batteryNotes: accessory.batteryNotes ?? ""
    });
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    async function handleSave() {
        if (!form.name.trim()) {
            setError("Name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/accessories/${accessory.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    manufacturer: form.manufacturer.trim(),
                    model: form.model.trim() || null,
                    caliber: form.caliber.trim() || null,
                    purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
                    imageUrl: form.imageUrl.trim() || null,
                    notes: form.notes.trim() || null,
                    hasBattery: form.hasBattery,
                    batteryType: form.hasBattery ? form.batteryType.trim() || null : null,
                    batteryReplacementIntervalDays: form.hasBattery && form.batteryReplacementIntervalDays ? parseInt(form.batteryReplacementIntervalDays, 10) : null,
                    lastBatteryChangeDate: form.hasBattery && form.lastBatteryChangeDate ? form.lastBatteryChangeDate : null,
                    batteryNotes: form.hasBattery ? form.batteryNotes.trim() || null : null
                })
            });
            if (!res.ok) {
                const j = await res.json();
                setError(j.error ?? "Failed to save");
                return;
            }
            onSaved();
            onClose();
        } catch  {
            setError("Network error");
        } finally{
            setSaving(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[60] flex items-center justify-center p-4",
        style: {
            backgroundColor: "var(--vault-overlay)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-vault-surface border border-vault-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up shadow-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between px-5 py-4 border-b border-vault-border shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                    className: "w-4 h-4 text-[#00C2FF]"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 238,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-sm font-semibold text-vault-text",
                                    children: "Edit Accessory"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 239,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 237,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "w-8 h-8 rounded-md flex items-center justify-center text-vault-text-muted hover:text-vault-text hover:bg-vault-border transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 245,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 241,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 236,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-5 space-y-4",
                    children: [
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                    className: "w-4 h-4 text-[#E53935] shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 253,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[#E53935]",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 252,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                    children: "Name *"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 259,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: form.name,
                                    onChange: (e)=>setForm((f)=>({
                                                ...f,
                                                name: e.target.value
                                            })),
                                    className: FIELD_CLASS,
                                    placeholder: "Accessory name"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 262,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 258,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Manufacturer"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 272,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: form.manufacturer,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        manufacturer: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "e.g. Trijicon"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 275,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 271,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Model"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 283,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: form.model,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        model: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "Optional"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 286,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 282,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 270,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Caliber"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 297,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: form.caliber,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        caliber: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "Optional"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 300,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 296,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Purchase Price"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 308,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            value: form.purchasePrice,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        purchasePrice: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "0.00"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 311,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 295,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                    children: "Image URL"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 322,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: form.imageUrl,
                                    onChange: (e)=>setForm((f)=>({
                                                ...f,
                                                imageUrl: e.target.value
                                            })),
                                    className: FIELD_CLASS,
                                    placeholder: "https://..."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 325,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 321,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                    children: "Notes"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 334,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    rows: 3,
                                    value: form.notes,
                                    onChange: (e)=>setForm((f)=>({
                                                ...f,
                                                notes: e.target.value
                                            })),
                                    className: `${FIELD_CLASS} resize-none`,
                                    placeholder: "Optional notes..."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 337,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 333,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex items-center gap-2 text-xs text-vault-text cursor-pointer",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: form.hasBattery,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        hasBattery: e.target.checked
                                                    })),
                                            className: "rounded border-vault-border bg-vault-bg text-[#00C2FF] focus:ring-[#00C2FF]"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 348,
                                            columnNumber: 15
                                        }, this),
                                        "Battery-powered accessory"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 347,
                                    columnNumber: 13
                                }, this),
                                form.hasBattery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Battery Type"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 361,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    value: form.batteryType,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                batteryType: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "e.g. CR2032"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 364,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 360,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Replace Every (days)"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 374,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    min: 1,
                                                    value: form.batteryReplacementIntervalDays,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                batteryReplacementIntervalDays: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "e.g. 180"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 373,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Last Change"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "date",
                                                    value: form.lastBatteryChangeDate,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                lastBatteryChangeDate: e.target.value
                                                            })),
                                                    className: FIELD_CLASS
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 395,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 391,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Battery Notes"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    rows: 2,
                                                    value: form.batteryNotes,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                batteryNotes: e.target.value
                                                            })),
                                                    className: `${FIELD_CLASS} resize-none`,
                                                    placeholder: "Optional battery notes"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 411,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 407,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 359,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 346,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 250,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 py-3 border-t border-vault-border shrink-0 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            disabled: saving,
                            className: "text-sm text-vault-text-muted hover:text-vault-text border border-vault-border px-4 py-1.5 rounded-md transition-colors disabled:opacity-50",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 428,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleSave,
                            disabled: saving,
                            className: "flex items-center gap-2 text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50",
                            children: [
                                saving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                    className: "w-3.5 h-3.5 animate-spin"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 440,
                                    columnNumber: 23
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                    className: "w-3.5 h-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 440,
                                    columnNumber: 74
                                }, this),
                                saving ? "Saving..." : "Save Changes"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 435,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 427,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
            lineNumber: 234,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
        lineNumber: 230,
        columnNumber: 5
    }, this);
}
function AccessoryBrowserModal({ slotType, buildId, onClose, onAssigned }) {
    const [accessories, setAccessories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [assigning, setAssigning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [assignError, setAssignError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("browse");
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        manufacturer: "",
        model: "",
        caliber: "",
        purchasePrice: "",
        imageUrl: "",
        hasBattery: false,
        batteryType: "",
        batteryReplacementIntervalDays: "",
        lastBatteryChangeDate: "",
        batteryNotes: ""
    });
    const [creating, setCreating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [createError, setCreateError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetch(`/api/accessories`).then((r)=>r.json()).then((data)=>{
            if (Array.isArray(data)) {
                setAccessories(data);
            } else {
                setError(data.error ?? "Failed to load accessories");
            }
            setLoading(false);
        }).catch(()=>{
            setError("Network error");
            setLoading(false);
        });
    }, [
        slotType
    ]);
    const filtered = accessories.filter((a)=>{
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.manufacturer.toLowerCase().includes(q) || (a.model ?? "").toLowerCase().includes(q);
    });
    async function assignAccessory(accessoryId) {
        setAssigning(accessoryId);
        setAssignError(null);
        try {
            const res = await fetch(`/api/builds/${buildId}/slots`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slotType,
                    accessoryId
                })
            });
            const json = await res.json();
            if (!res.ok) {
                setAssignError(json.error ?? "Failed to assign accessory");
            } else {
                onAssigned();
                onClose();
            }
        } catch  {
            setAssignError("Network error");
        } finally{
            setAssigning(null);
        }
    }
    async function handleCreate() {
        if (!form.name.trim()) {
            setCreateError("Name is required");
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const createRes = await fetch("/api/accessories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    manufacturer: form.manufacturer.trim(),
                    model: form.model.trim() || undefined,
                    type: slotType,
                    caliber: form.caliber.trim() || undefined,
                    purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
                    imageUrl: form.imageUrl.trim() || undefined,
                    hasBattery: form.hasBattery,
                    batteryType: form.hasBattery ? form.batteryType.trim() || undefined : null,
                    batteryReplacementIntervalDays: form.hasBattery && form.batteryReplacementIntervalDays ? parseInt(form.batteryReplacementIntervalDays, 10) : null,
                    lastBatteryChangeDate: form.hasBattery && form.lastBatteryChangeDate ? form.lastBatteryChangeDate : null,
                    batteryNotes: form.hasBattery ? form.batteryNotes.trim() || undefined : null
                })
            });
            const created = await createRes.json();
            if (!createRes.ok) {
                setCreateError(created.error ?? "Failed to create accessory");
                return;
            }
            const assignRes = await fetch(`/api/builds/${buildId}/slots`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slotType,
                    accessoryId: created.id
                })
            });
            if (!assignRes.ok) {
                const j = await assignRes.json();
                setCreateError(j.error ?? "Created but failed to assign");
                return;
            }
            onAssigned();
            onClose();
        } catch  {
            setCreateError("Network error");
        } finally{
            setCreating(false);
        }
    }
    const slotIconConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$icons$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_ICONS"][slotType];
    const SlotIcon = slotIconConfig?.icon ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"];
    const slotTypeLabel = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_TYPE_LABELS"][slotType] ?? getCustomSlotLabel(slotType);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            backgroundColor: "var(--vault-overlay)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-vault-surface border border-vault-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between px-5 py-4 border-b border-vault-border shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-8 h-8 rounded-md flex items-center justify-center",
                                    style: {
                                        backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}18`
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotIcon, {
                                        className: "w-4 h-4",
                                        style: {
                                            color: slotIconConfig?.color ?? "#8B9DB0"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 610,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 606,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-vault-text-faint uppercase tracking-widest font-mono",
                                            children: "Assign Attachment"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 616,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-sm font-semibold text-vault-text",
                                            children: slotTypeLabel
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 619,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 615,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 605,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "w-8 h-8 rounded-md flex items-center justify-center text-vault-text-muted hover:text-vault-text hover:bg-vault-border transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 628,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 624,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 604,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex border-b border-vault-border shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setView("browse"),
                            className: `flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors ${view === "browse" ? "text-[#00C2FF] border-b-2 border-[#00C2FF]" : "text-vault-text-faint hover:text-vault-text-muted"}`,
                            children: "Browse Library"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 634,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setView("create"),
                            className: `flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors ${view === "create" ? "text-[#00C2FF] border-b-2 border-[#00C2FF]" : "text-vault-text-faint hover:text-vault-text-muted"}`,
                            children: "+ Create New"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 644,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 633,
                    columnNumber: 9
                }, this),
                view === "browse" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 py-3 border-b border-vault-border shrink-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 659,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: search,
                                onChange: (e)=>setSearch(e.target.value),
                                placeholder: `Search accessories...`,
                                className: "w-full bg-vault-bg border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint",
                                autoFocus: true
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 660,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 658,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 657,
                    columnNumber: 11
                }, this),
                view === "browse" && assignError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-5 mt-3 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2 shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                            className: "w-4 h-4 text-[#E53935] shrink-0"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 674,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-[#E53935]",
                            children: assignError
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 675,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 673,
                    columnNumber: 11
                }, this),
                view === "browse" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-5",
                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center py-16",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                            className: "w-6 h-6 text-[#00C2FF] animate-spin"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 683,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 682,
                        columnNumber: 15
                    }, this) : error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center py-16 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-8 h-8 text-[#E53935]"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 687,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-[#E53935]",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 688,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 686,
                        columnNumber: 15
                    }, this) : filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center py-16 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-12 h-12 rounded-full bg-vault-border flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__["Crosshair"], {
                                    className: "w-6 h-6 text-vault-text-faint"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 693,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 692,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-vault-text-muted",
                                children: search ? "No accessories match your search" : "No accessories in your collection"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 695,
                                columnNumber: 17
                            }, this),
                            !search && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setView("create"),
                                className: "text-xs text-[#00C2FF] hover:underline",
                                children: "Create one now"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 699,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 691,
                        columnNumber: 15
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                        children: filtered.map((acc)=>{
                            const isAssigning = assigning === acc.id;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>assignAccessory(acc.id),
                                disabled: !!assigning,
                                className: "flex items-center gap-3 text-left w-full bg-vault-bg border border-vault-border hover:border-[#00C2FF]/40 hover:bg-[#00C2FF]/5 rounded-lg p-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-14 h-14 shrink-0 rounded-md overflow-hidden bg-vault-surface border border-vault-border flex items-center justify-center",
                                        children: acc.imageUrl ? // eslint-disable-next-line @next/next/no-img-element
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: acc.imageUrl,
                                            alt: acc.name,
                                            className: "w-full h-full object-contain p-1"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 721,
                                            columnNumber: 27
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotIcon, {
                                            className: "w-6 h-6",
                                            style: {
                                                color: slotIconConfig?.color ?? "#4A5A6B"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 723,
                                            columnNumber: 27
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 718,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-medium text-vault-text truncate group-hover:text-[#00C2FF] transition-colors",
                                                children: acc.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 727,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-vault-text-muted truncate",
                                                children: acc.manufacturer
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 730,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 mt-1",
                                                children: [
                                                    acc.caliber && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded",
                                                        children: acc.caliber
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                        lineNumber: 733,
                                                        columnNumber: 29
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-mono text-[#F5A623]",
                                                        children: [
                                                            acc.roundCount.toLocaleString(),
                                                            " rds"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                        lineNumber: 737,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 731,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 726,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "shrink-0",
                                        children: isAssigning ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "w-4 h-4 text-[#00C2FF] animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 744,
                                            columnNumber: 27
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "w-4 h-4 text-vault-text-faint group-hover:text-[#00C2FF] transition-colors"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 746,
                                            columnNumber: 27
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 742,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, acc.id, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 712,
                                columnNumber: 21
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 708,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 680,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-5",
                    children: [
                        createError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                    className: "w-4 h-4 text-[#E53935] shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 759,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[#E53935]",
                                    children: createError
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 760,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 758,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Type"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 765,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text-muted font-mono",
                                            children: slotTypeLabel
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 766,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 764,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Name *"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 771,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: form.name,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        name: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "e.g. Trijicon ACOG 4x32"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 772,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 770,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                            children: "Manufacturer"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 776,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: form.manufacturer,
                                            onChange: (e)=>setForm((f)=>({
                                                        ...f,
                                                        manufacturer: e.target.value
                                                    })),
                                            className: FIELD_CLASS,
                                            placeholder: "e.g. Trijicon"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 777,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 775,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Model"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 782,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    value: form.model,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                model: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "Optional"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 783,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 781,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Caliber"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 787,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    value: form.caliber,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                caliber: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "Optional"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 788,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 786,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 780,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Purchase Price"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 794,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    value: form.purchasePrice,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                purchasePrice: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "0.00"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 795,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 793,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                    children: "Image URL"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 799,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    value: form.imageUrl,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                imageUrl: e.target.value
                                                            })),
                                                    className: FIELD_CLASS,
                                                    placeholder: "https://..."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 800,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 798,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 792,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "flex items-center gap-2 text-xs text-vault-text cursor-pointer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: form.hasBattery,
                                                    onChange: (e)=>setForm((f)=>({
                                                                ...f,
                                                                hasBattery: e.target.checked
                                                            })),
                                                    className: "rounded border-vault-border bg-vault-bg text-[#00C2FF] focus:ring-[#00C2FF]"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 806,
                                                    columnNumber: 19
                                                }, this),
                                                "Battery-powered accessory"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 805,
                                            columnNumber: 17
                                        }, this),
                                        form.hasBattery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                            children: "Battery Type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 817,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            value: form.batteryType,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        batteryType: e.target.value
                                                                    })),
                                                            className: FIELD_CLASS,
                                                            placeholder: "e.g. CR2032"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 818,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 816,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                            children: "Replace Every (days)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 826,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            min: 1,
                                                            value: form.batteryReplacementIntervalDays,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        batteryReplacementIntervalDays: e.target.value
                                                                    })),
                                                            className: FIELD_CLASS,
                                                            placeholder: "e.g. 180"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 827,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 825,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                            children: "Last Change"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 837,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "date",
                                                            value: form.lastBatteryChangeDate,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        lastBatteryChangeDate: e.target.value
                                                                    })),
                                                            className: FIELD_CLASS
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 838,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 836,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "sm:col-span-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5",
                                                            children: "Battery Notes"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 846,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                            rows: 2,
                                                            value: form.batteryNotes,
                                                            onChange: (e)=>setForm((f)=>({
                                                                        ...f,
                                                                        batteryNotes: e.target.value
                                                                    })),
                                                            className: `${FIELD_CLASS} resize-none`,
                                                            placeholder: "Optional battery notes"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                            lineNumber: 847,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 845,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 815,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 804,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 763,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 756,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 py-3 border-t border-vault-border shrink-0 flex items-center justify-between",
                    children: view === "browse" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-vault-text-faint",
                                children: [
                                    filtered.length,
                                    " accessor",
                                    filtered.length !== 1 ? "ies" : "y"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 865,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "text-sm text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 px-4 py-1.5 rounded-md transition-colors",
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 868,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                disabled: creating,
                                className: "text-sm text-vault-text-muted hover:text-vault-text border border-vault-border px-4 py-1.5 rounded-md transition-colors disabled:opacity-50",
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 877,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleCreate,
                                disabled: creating,
                                className: "flex items-center gap-2 text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50",
                                children: [
                                    creating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "w-3.5 h-3.5 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 883,
                                        columnNumber: 29
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                        className: "w-3.5 h-3.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 883,
                                        columnNumber: 80
                                    }, this),
                                    creating ? "Creating..." : "Create & Assign"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 881,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 862,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
            lineNumber: 602,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
        lineNumber: 598,
        columnNumber: 5
    }, this);
}
function WeaponCanvas({ build, onSlotClick, onRemoveSlot }) {
    const firearmType = build.firearm.type;
    const positions = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$positions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_POSITIONS"][firearmType] ?? {};
    const availableSlots = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOTS_BY_FIREARM_TYPE"][firearmType] ?? [];
    const slotMap = {};
    for (const slot of build.slots){
        slotMap[slot.slotType] = slot;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full h-full bg-vault-canvas overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 tactical-grid opacity-60"
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 914,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00C2FF]/20"
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 915,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00C2FF]/20"
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 916,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00C2FF]/20"
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 917,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00C2FF]/20"
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 918,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 flex items-center justify-center p-16",
                children: build.firearm.imageUrl ? // eslint-disable-next-line @next/next/no-img-element
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: build.firearm.imageUrl,
                    alt: build.firearm.name,
                    className: "w-full h-full object-contain",
                    style: {
                        filter: "drop-shadow(0 0 24px rgba(0,194,255,0.12))"
                    }
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 923,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center gap-4 text-center select-none",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                            className: "w-20 h-20 text-vault-border"
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 931,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg font-bold text-vault-border",
                                    children: build.firearm.name
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 933,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-vault-surface-2 font-mono mt-1 uppercase tracking-widest",
                                    children: build.firearm.type
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 934,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 932,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 930,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 920,
                columnNumber: 7
            }, this),
            availableSlots.map((slotType)=>{
                const pos = positions[slotType];
                if (!pos) return null;
                const slot = slotMap[slotType];
                const hasAccessory = !!slot?.accessory;
                const slotIconConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$icons$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_ICONS"][slotType];
                const SlotIcon = slotIconConfig?.icon ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"];
                if (hasAccessory && slot?.accessory) {
                    const acc = slot.accessory;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute z-10 group",
                        style: {
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium cursor-default whitespace-nowrap max-w-[140px]",
                                    style: {
                                        backgroundColor: "var(--vault-canvas)",
                                        borderColor: `${slotIconConfig?.color ?? "#00C2FF"}40`,
                                        color: slotIconConfig?.color ?? "#00C2FF",
                                        boxShadow: `0 0 10px ${slotIconConfig?.color ?? "#00C2FF"}20`
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotIcon, {
                                            className: "w-2.5 h-2.5 shrink-0"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 958,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "truncate",
                                            children: acc.name
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 959,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 956,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap",
                                    style: {
                                        backgroundColor: "var(--vault-canvas)",
                                        color: "#F5A623",
                                        border: "1px solid rgba(245,166,35,0.3)"
                                    },
                                    children: [
                                        acc.roundCount.toLocaleString(),
                                        "r"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 961,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        onRemoveSlot(slotType);
                                    },
                                    className: "absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#E53935] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                                    title: "Remove",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 967,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 965,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 955,
                            columnNumber: 15
                        }, this)
                    }, slotType, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 954,
                        columnNumber: 13
                    }, this);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>onSlotClick(slotType),
                    className: "absolute z-10 group",
                    style: {
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: "translate(-50%, -50%)"
                    },
                    title: `Add ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_TYPE_LABELS"][slotType]}`,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex items-center justify-center w-5 h-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute w-5 h-5 rounded-full animate-pulse-ring",
                                style: {
                                    backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}18`,
                                    border: `1px solid ${slotIconConfig?.color ?? "#8B9DB0"}50`
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 979,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2 h-2 rounded-full",
                                style: {
                                    backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}80`
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 981,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-vault-canvas border border-vault-border rounded text-[10px] text-vault-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_TYPE_LABELS"][slotType]
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 982,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 978,
                        columnNumber: 13
                    }, this)
                }, slotType, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 975,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[10px] font-mono text-vault-border uppercase tracking-[0.3em]",
                    children: build.name
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 991,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 990,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
        lineNumber: 913,
        columnNumber: 5
    }, this);
}
function SlotPanel({ build, allBuilds, onSlotClick, onRemoveSlot, onAddCustomSlot, onRenameCustomSlot, onDeleteCustomSlot, onSwitchBuild, onEditAccessory, actionError, actionSuccess }) {
    const [switchOpen, setSwitchOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [addingCustomGroup, setAddingCustomGroup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [customSlotName, setCustomSlotName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [quickAddName, setQuickAddName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [quickAddCategory, setQuickAddCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("__OTHER__");
    const [renamingSlotType, setRenamingSlotType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [renameValue, setRenameValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const firearmType = build.firearm.type;
    const availableSlots = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOTS_BY_FIREARM_TYPE"][firearmType] ?? [];
    const slotMap = {};
    for (const slot of build.slots){
        slotMap[slot.slotType] = slot;
    }
    const otherBuilds = allBuilds.filter((b)=>b.id !== build.id);
    const filledCount = build.slots.filter((s)=>s.accessoryId).length;
    const customSlots = build.slots.filter((slot)=>isCustomSlotType(slot.slotType));
    const totalSlotCount = availableSlots.length + customSlots.length;
    const customSlotsByCategory = customSlots.reduce((acc, slot)=>{
        const parsed = parseCustomSlot(slot.slotType);
        const key = parsed?.category || "__OTHER__";
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
    }, {});
    const visibleGroups = SLOT_GROUPS.map((group)=>({
            ...group,
            standardSlots: group.slotTypes.filter((slotType)=>availableSlots.includes(slotType)),
            customSlots: customSlotsByCategory[group.key] ?? []
        })).filter((group)=>group.standardSlots.length > 0 || group.customSlots.length > 0);
    const otherCustomSlots = customSlotsByCategory.__OTHER__ ?? [];
    function submitCustomSlot(category) {
        const trimmed = customSlotName.trim();
        if (!trimmed) return;
        onAddCustomSlot(category, trimmed);
        setCustomSlotName("");
        setAddingCustomGroup(null);
    }
    function startRenameCustomSlot(slotType) {
        setRenamingSlotType(slotType);
        setRenameValue(getCustomSlotLabel(slotType));
    }
    function submitRenameCustomSlot(slotType) {
        const trimmed = renameValue.trim();
        if (!trimmed) return;
        onRenameCustomSlot(slotType, trimmed);
        setRenamingSlotType(null);
        setRenameValue("");
    }
    function submitQuickCustomSlot() {
        const trimmed = quickAddName.trim();
        if (!trimmed) return;
        onAddCustomSlot(quickAddCategory === "__OTHER__" ? null : quickAddCategory, trimmed);
        setQuickAddName("");
    }
    function slotCard(slotType) {
        const slot = slotMap[slotType];
        const hasAccessory = !!slot?.accessory;
        const custom = isCustomSlotType(slotType);
        const slotIconConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$configurator$2f$slot$2d$icons$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_ICONS"][slotType];
        const SlotIcon = slotIconConfig?.icon ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"];
        const label = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_TYPE_LABELS"][slotType] ?? getCustomSlotLabel(slotType);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-vault-bg border border-vault-border rounded-lg p-2.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-6 h-6 rounded flex items-center justify-center",
                            style: {
                                backgroundColor: hasAccessory ? `${slotIconConfig?.color ?? "#8B9DB0"}15` : "transparent"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotIcon, {
                                className: "w-3.5 h-3.5",
                                style: {
                                    color: hasAccessory ? slotIconConfig?.color ?? "#8B9DB0" : "#2A3B4C"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1105,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1103,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: `text-[10px] uppercase tracking-widest font-mono ${hasAccessory ? "text-vault-text-faint" : "text-vault-border"}`,
                            children: label
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1108,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1102,
                    columnNumber: 9
                }, this),
                custom && renamingSlotType === slotType ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 space-y-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            value: renameValue,
                            onChange: (e)=>setRenameValue(e.target.value),
                            onKeyDown: (e)=>{
                                if (e.key === "Enter") submitRenameCustomSlot(slotType);
                                if (e.key === "Escape") setRenamingSlotType(null);
                            },
                            className: `${FIELD_CLASS} text-xs py-1.5`,
                            autoFocus: true
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1115,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-1.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>submitRenameCustomSlot(slotType),
                                    className: "text-[9px] text-[#00C2FF] border border-[#00C2FF]/40 px-1.5 py-0.5 rounded hover:bg-[#00C2FF]/10 transition-colors",
                                    children: "Save"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1126,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setRenamingSlotType(null),
                                    className: "text-[9px] text-vault-text-muted border border-vault-border px-1.5 py-0.5 rounded hover:text-vault-text transition-colors",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1132,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1125,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1114,
                    columnNumber: 11
                }, this) : hasAccessory && slot?.accessory ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 space-y-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-medium text-vault-text truncate",
                            children: slot.accessory.name
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1142,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-1.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[9px] font-mono text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-1.5 py-0.5 rounded",
                                    children: [
                                        slot.accessory.roundCount.toLocaleString(),
                                        "r"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1144,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onEditAccessory(slot.accessory),
                                    className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors",
                                    title: "Edit accessory",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1152,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1147,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onSlotClick(slotType),
                                    className: "text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors",
                                    children: "Change"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1154,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onRemoveSlot(slotType),
                                    className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors",
                                    title: "Remove accessory",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1165,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1160,
                                    columnNumber: 15
                                }, this),
                                custom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>startRenameCustomSlot(slotType),
                                    className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors",
                                    title: "Edit custom slot",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1173,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1168,
                                    columnNumber: 17
                                }, this),
                                custom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onDeleteCustomSlot(slotType),
                                    className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors",
                                    title: "Delete custom slot",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1182,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1177,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1143,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1141,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 flex items-center gap-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onSlotClick(slotType),
                            className: "flex items-center gap-1 text-[9px] text-vault-text-faint hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                    className: "w-2.5 h-2.5"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1193,
                                    columnNumber: 15
                                }, this),
                                "Assign"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1189,
                            columnNumber: 13
                        }, this),
                        custom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>startRenameCustomSlot(slotType),
                            className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors",
                            title: "Edit custom slot",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                className: "w-2.5 h-2.5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1202,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1197,
                            columnNumber: 15
                        }, this),
                        custom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onDeleteCustomSlot(slotType),
                            className: "w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors",
                            title: "Delete custom slot",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-2.5 h-2.5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1211,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1206,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1188,
                    columnNumber: 11
                }, this)
            ]
        }, slotType, true, {
            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
            lineNumber: 1101,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full flex flex-col bg-vault-surface border-t md:border-t-0 border-l-0 md:border-l border-vault-border",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-4 border-b border-vault-border shrink-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] text-vault-text-faint uppercase tracking-widest font-mono mb-1",
                        children: [
                            build.firearm.name,
                            " · ",
                            build.firearm.caliber
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1223,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-bold text-vault-text leading-tight truncate",
                                children: build.name
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1227,
                                columnNumber: 11
                            }, this),
                            build.isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "shrink-0 flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1230,
                                        columnNumber: 15
                                    }, this),
                                    "Active"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1229,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] text-vault-text-faint",
                                        children: [
                                            filledCount,
                                            "/",
                                            totalSlotCount,
                                            " slots configured"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1237,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] text-vault-text-faint font-mono",
                                        children: [
                                            Math.round(filledCount / (totalSlotCount || 1) * 100),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1238,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1236,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-0.5 bg-vault-border rounded-full overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-full bg-[#00C2FF] rounded-full transition-all duration-500",
                                    style: {
                                        width: `${filledCount / (totalSlotCount || 1) * 100}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1241,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1240,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1235,
                        columnNumber: 9
                    }, this),
                    otherBuilds.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative mt-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSwitchOpen((o)=>!o),
                                className: "flex items-center justify-between w-full text-xs text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 rounded-md px-3 py-2 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Switch Build"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1250,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                        className: `w-3 h-3 transition-transform ${switchOpen ? "rotate-180" : ""}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1251,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1248,
                                columnNumber: 13
                            }, this),
                            switchOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute z-30 top-full left-0 right-0 mt-1 bg-vault-bg border border-vault-border rounded-md shadow-xl overflow-hidden",
                                children: otherBuilds.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            onSwitchBuild(b.id);
                                            setSwitchOpen(false);
                                        },
                                        className: "flex items-center justify-between w-full text-left px-3 py-2 text-sm text-vault-text hover:bg-vault-surface transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "truncate",
                                                children: b.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 1258,
                                                columnNumber: 21
                                            }, this),
                                            b.isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ml-2 shrink-0 text-[9px] text-[#00C853] font-mono",
                                                children: "ACTIVE"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 1259,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, b.id, true, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1256,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1254,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1247,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1222,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto px-4 py-4 space-y-4",
                children: [
                    (actionError || actionSuccess) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `rounded-md border px-3 py-2 ${actionError ? "bg-[#E53935]/10 border-[#E53935]/30" : "bg-[#00C853]/10 border-[#00C853]/30"}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: `text-xs ${actionError ? "text-[#E53935]" : "text-[#00C853]"}`,
                            children: actionError ?? actionSuccess
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1271,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1270,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-vault-border bg-vault-bg p-3 space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase tracking-widest font-mono text-vault-text-faint",
                                children: "Quick Actions"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1278,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-vault-text-muted",
                                children: [
                                    "Add a custom slot here, then use ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-vault-text",
                                        children: "Assign"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1280,
                                        columnNumber: 46
                                    }, this),
                                    " on any slot card to select or create an accessory."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1279,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: quickAddCategory,
                                        onChange: (e)=>setQuickAddCategory(e.target.value),
                                        className: `${FIELD_CLASS} text-xs py-1.5 sm:col-span-1`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "__OTHER__",
                                                children: "Other"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                lineNumber: 1288,
                                                columnNumber: 15
                                            }, this),
                                            SLOT_GROUPS.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: group.key,
                                                    children: group.label
                                                }, group.key, false, {
                                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                                    lineNumber: 1290,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1283,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: quickAddName,
                                        onChange: (e)=>setQuickAddName(e.target.value),
                                        onKeyDown: (e)=>{
                                            if (e.key === "Enter") submitQuickCustomSlot();
                                        },
                                        placeholder: "Custom slot name",
                                        className: `${FIELD_CLASS} text-xs py-1.5 sm:col-span-2`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1295,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1282,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-end",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: submitQuickCustomSlot,
                                    className: "text-xs text-[#00C2FF] border border-[#00C2FF]/40 px-2 py-1.5 rounded hover:bg-[#00C2FF]/10 transition-colors",
                                    children: "+ Add Custom Slot"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1306,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1305,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1277,
                        columnNumber: 9
                    }, this),
                    visibleGroups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] text-vault-text-faint uppercase tracking-widest font-mono",
                                            children: group.label
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 1318,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setAddingCustomGroup(group.key);
                                                setCustomSlotName("");
                                            },
                                            className: "text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors",
                                            children: "+ Custom Slot"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 1319,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1317,
                                    columnNumber: 13
                                }, this),
                                addingCustomGroup === group.key && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: customSlotName,
                                            onChange: (e)=>setCustomSlotName(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter") submitCustomSlot(group.key);
                                                if (e.key === "Escape") setAddingCustomGroup(null);
                                            },
                                            placeholder: `New ${group.label.toLowerCase()} slot`,
                                            className: `${FIELD_CLASS} text-xs py-1.5`,
                                            autoFocus: true
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 1331,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>submitCustomSlot(group.key),
                                            className: "text-xs text-[#00C2FF] border border-[#00C2FF]/40 px-2 py-1.5 rounded hover:bg-[#00C2FF]/10 transition-colors",
                                            children: "Add"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                            lineNumber: 1342,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1330,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 gap-2",
                                    children: [
                                        group.standardSlots.map((slotType)=>slotCard(slotType)),
                                        group.customSlots.map((slot)=>slotCard(slot.slotType))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                    lineNumber: 1350,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, group.key, true, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1316,
                            columnNumber: 11
                        }, this)),
                    (otherCustomSlots.length > 0 || addingCustomGroup === "__OTHER__") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] text-vault-text-faint uppercase tracking-widest font-mono",
                                        children: "Other Custom Slots"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1360,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setAddingCustomGroup("__OTHER__");
                                            setCustomSlotName("");
                                        },
                                        className: "text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors",
                                        children: "+ Custom Slot"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1361,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1359,
                                columnNumber: 13
                            }, this),
                            addingCustomGroup === "__OTHER__" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: customSlotName,
                                        onChange: (e)=>setCustomSlotName(e.target.value),
                                        onKeyDown: (e)=>{
                                            if (e.key === "Enter") submitCustomSlot(null);
                                            if (e.key === "Escape") setAddingCustomGroup(null);
                                        },
                                        placeholder: "New custom slot",
                                        className: `${FIELD_CLASS} text-xs py-1.5`,
                                        autoFocus: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1373,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>submitCustomSlot(null),
                                        className: "text-xs text-[#00C2FF] border border-[#00C2FF]/40 px-2 py-1.5 rounded hover:bg-[#00C2FF]/10 transition-colors",
                                        children: "Add"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1384,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1372,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 gap-2",
                                children: otherCustomSlots.map((slot)=>slotCard(slot.slotType))
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1392,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1358,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1268,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
        lineNumber: 1221,
        columnNumber: 5
    }, this);
}
function BuildConfiguratorPage() {
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const firearmId = params.id;
    const buildId = params.buildId;
    const [build, setBuild] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [allBuilds, setAllBuilds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activatingBuild, setActivatingBuild] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [actionError, setActionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [actionSuccess, setActionSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [browserSlot, setBrowserSlot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingAccessory, setEditingAccessory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    function showSuccess(message) {
        setActionError(null);
        setActionSuccess(message);
        setTimeout(()=>setActionSuccess((current)=>current === message ? null : current), 2500);
    }
    function showError(message) {
        setActionSuccess(null);
        setActionError(message);
    }
    const fetchBuild = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const [buildRes, allBuildsRes] = await Promise.all([
                fetch(`/api/builds/${buildId}`),
                fetch(`/api/builds?firearmId=${firearmId}`)
            ]);
            const buildData = await buildRes.json();
            const allBuildsData = await allBuildsRes.json();
            if (!buildRes.ok) {
                setError(buildData.error ?? "Build not found");
            } else {
                setBuild(buildData);
            }
            if (allBuildsRes.ok && Array.isArray(allBuildsData)) {
                setAllBuilds(allBuildsData);
            }
        } catch  {
            setError("Failed to load build");
        } finally{
            setLoading(false);
        }
    }, [
        buildId,
        firearmId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchBuild();
    }, [
        fetchBuild
    ]);
    async function handleRemoveSlot(slotType) {
        if (!build) return;
        try {
            const res = await fetch(`/api/builds/${buildId}/slots`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slotType,
                    accessoryId: null
                })
            });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) {
                showError(json.error ?? "Failed to remove accessory from slot");
                return;
            }
            showSuccess("Accessory removed from slot.");
            fetchBuild();
        } catch  {
            showError("Network error while updating slot.");
        }
    }
    async function handleAddCustomSlot(category, name) {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const slotType = category ? `CUSTOM:${category}|${trimmedName}` : `CUSTOM:${trimmedName}`;
        try {
            const res = await fetch(`/api/builds/${buildId}/slots`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slotType,
                    accessoryId: null
                })
            });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) {
                showError(json.error ?? "Failed to add custom slot");
                return;
            }
            showSuccess("Custom slot added.");
            fetchBuild();
        } catch  {
            showError("Network error while adding custom slot.");
        }
    }
    async function handleRenameCustomSlot(slotType, name) {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        try {
            const res = await fetch(`/api/builds/${buildId}/slots`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slotType,
                    newName: trimmedName
                })
            });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) {
                showError(json.error ?? "Failed to rename custom slot");
                return;
            }
            showSuccess("Custom slot renamed.");
            fetchBuild();
        } catch  {
            showError("Network error while renaming custom slot.");
        }
    }
    async function handleDeleteCustomSlot(slotType) {
        try {
            const res = await fetch(`/api/builds/${buildId}/slots?slotType=${encodeURIComponent(slotType)}`, {
                method: "DELETE"
            });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) {
                showError(json.error ?? "Failed to delete custom slot");
                return;
            }
            showSuccess("Custom slot deleted.");
            fetchBuild();
        } catch  {
            showError("Network error while deleting custom slot.");
        }
    }
    async function handleActivate() {
        if (!build || build.isActive) return;
        setActivatingBuild(true);
        try {
            const res = await fetch(`/api/builds/${buildId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    isActive: true
                })
            });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) {
                showError(json.error ?? "Failed to activate build");
                return;
            }
            showSuccess("Build activated.");
            fetchBuild();
        } catch  {
            showError("Network error while activating build.");
        } finally{
            setActivatingBuild(false);
        }
    }
    function handleSwitchBuild(newBuildId) {
        router.push(`/vault/${firearmId}/builds/${newBuildId}`);
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-10 h-10 text-[#00C2FF] animate-spin mb-4"
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1571,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-vault-text-muted font-mono uppercase tracking-widest",
                    children: "Loading Configurator..."
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1572,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
            lineNumber: 1570,
            columnNumber: 7
        }, this);
    }
    if (error || !build) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                    className: "w-12 h-12 text-[#E53935]"
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1580,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[#E53935]",
                    children: error ?? "Build not found"
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1581,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: `/vault/${firearmId}`,
                    className: "text-sm text-[#00C2FF] hover:underline",
                    children: "Back to Firearm"
                }, void 0, false, {
                    fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                    lineNumber: 1582,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
            lineNumber: 1579,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-screen bg-vault-canvas overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-2.5 border-b border-vault-border bg-vault-bg shrink-0 z-20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: `/vault/${firearmId}`,
                                className: "flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-xs transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                        className: "w-3.5 h-3.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1594,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "hidden sm:inline",
                                        children: build.firearm.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1595,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "sm:hidden",
                                        children: "Back"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1596,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1592,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-vault-border text-xs",
                                children: "/"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1598,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-vault-text font-medium",
                                children: build.name
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1599,
                                columnNumber: 11
                            }, this),
                            build.isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                        className: "w-2.5 h-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1602,
                                        columnNumber: 15
                                    }, this),
                                    "Active"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1601,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1591,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline text-[10px] font-mono text-vault-text-faint border border-vault-border px-2 py-0.5 rounded uppercase",
                                children: build.firearm.type
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1608,
                                columnNumber: 11
                            }, this),
                            !build.isActive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleActivate,
                                disabled: activatingBuild,
                                className: "flex items-center gap-1.5 text-xs bg-[#00C853]/10 border border-[#00C853]/40 text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-50 px-3 py-1.5 rounded transition-colors",
                                children: [
                                    activatingBuild ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "w-3 h-3 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1614,
                                        columnNumber: 34
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                        className: "w-3 h-3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                        lineNumber: 1614,
                                        columnNumber: 81
                                    }, this),
                                    "Activate Build"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1612,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-vault-text-faint px-3 py-1.5 border border-vault-border rounded",
                                children: "Build Active"
                            }, void 0, false, {
                                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                                lineNumber: 1618,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1607,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1590,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row flex-1 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative h-64 md:h-auto shrink-0 md:shrink md:[flex:0_0_65%]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WeaponCanvas, {
                            build: build,
                            onSlotClick: (slotType)=>setBrowserSlot(slotType),
                            onRemoveSlot: handleRemoveSlot
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1626,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1625,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 md:[flex:0_0_35%] overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotPanel, {
                            build: build,
                            allBuilds: allBuilds,
                            onSlotClick: (slotType)=>setBrowserSlot(slotType),
                            onRemoveSlot: handleRemoveSlot,
                            onAddCustomSlot: handleAddCustomSlot,
                            onRenameCustomSlot: handleRenameCustomSlot,
                            onDeleteCustomSlot: handleDeleteCustomSlot,
                            onSwitchBuild: handleSwitchBuild,
                            onEditAccessory: (acc)=>setEditingAccessory(acc),
                            actionError: actionError,
                            actionSuccess: actionSuccess
                        }, void 0, false, {
                            fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                            lineNumber: 1629,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                        lineNumber: 1628,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1624,
                columnNumber: 7
            }, this),
            browserSlot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccessoryBrowserModal, {
                slotType: browserSlot,
                buildId: buildId,
                onClose: ()=>setBrowserSlot(null),
                onAssigned: ()=>{
                    setBrowserSlot(null);
                    showSuccess("Accessory assigned to slot.");
                    fetchBuild();
                }
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1647,
                columnNumber: 9
            }, this),
            editingAccessory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccessoryEditModal, {
                accessory: editingAccessory,
                onClose: ()=>setEditingAccessory(null),
                onSaved: ()=>{
                    setEditingAccessory(null);
                    showSuccess("Accessory updated.");
                    fetchBuild();
                }
            }, void 0, false, {
                fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
                lineNumber: 1661,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/vault/[id]/builds/[buildId]/page.tsx",
        lineNumber: 1588,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_8df04550._.js.map