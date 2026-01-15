import React, { useState, useEffect } from 'react';
import {
    Coins,
    Calculator,
    ClipboardList,
    Building,
    Megaphone,
    CalendarCheck,
    Map,
    Landmark,
    Users,
    Ruler,
    Search,
    HardHat,
    BookOpen,
    Laptop,
    Smile,
    ExternalLink
} from 'lucide-react';
import pb from '../lib/pocketbase';
import './QuickLinks.css';

const DEFAULT_LINKS = [
    {
        id: '1',
        name: 'ตรวจสอบราคาประเมิน',
        url: 'https://assessprice.treasury.go.th/',
        icon: 'Coins',
        color: 'green'
    },
    {
        id: '7',
        name: 'ที่ตั้งสำนักงานที่ดิน',
        url: 'https://www.dol.go.th/contact-dol/',
        icon: 'Map',
        color: 'green'
    },
    {
        id: '2',
        name: 'คำนวณภาษีอากร',
        url: 'https://lecs.dol.go.th/rcal/#/',
        icon: 'Calculator',
        color: 'amber'
    },
    {
        id: '4',
        name: 'ค้นหาข้อมูลจัดสรรที่ดินและอาคารชุด',
        url: 'https://www.dol.go.th/land/',
        icon: 'Building',
        color: 'green'
    },
    {
        id: '5',
        name: 'ค้นหาประกาศที่ดิน',
        url: 'https://announce.dol.go.th/',
        icon: 'Megaphone',
        color: 'blue'
    },
    {
        id: '6',
        name: 'สำนักงานที่ดินจังหวัดนครพนม', // Generic fallback
        url: 'https://www.dol.go.th/nakhonphanom',
        icon: 'Landmark', // Changed name to Generic
        color: 'green'
    },

    {
        id: '9',
        name: 'Facebook นครพนม',
        url: 'https://www.facebook.com/dol.nakhonphanom/',
        icon: 'Users',
        color: 'blue'
    },
    {
        id: '10',
        name: 'ค่าใช้จ่ายการรังวัด',
        url: 'https://www.dol.go.th/dol-services/surveyprice/?ppp=20&ord=asc&kw=&sort=title',
        icon: 'Ruler',
        color: 'green'
    },

    {
        id: '11',
        name: 'ค้นหา น.ส.ล.',
        url: 'https://bpt.dol.go.th/landspublic/',
        icon: 'Search',
        color: 'green'
    },
    {
        id: '15',
        name: 'e-Service',
        url: 'https://eservice.dol.go.th/home',
        icon: 'Laptop',
        color: 'blue'
    },

];

const ICON_MAP = {
    Coins, Calculator, ClipboardList, Building, Megaphone,
    CalendarCheck, Map, Landmark, Users, Ruler, Search,
    HardHat, BookOpen, Laptop, Smile, ExternalLink
};

export default function QuickLinks() {
    const [links, setLinks] = useState(DEFAULT_LINKS);

    // Future: Fetch from PocketBase
    useEffect(() => {
        const loadLinks = async () => {
            try {
                // Check if 'quick_links' collection exists and has items
                // const records = await pb.collection('quick_links').getFullList({ sort: 'order' });
                // if (records && records.length > 0) {
                //    setLinks(records);
                // }
            } catch (e) {
                // Use defaults if failed or offline
                console.log('Using default quick links');
            }
        };
        loadLinks();
    }, []);

    return (
        <div className="quick-links-section">
            <div className="quick-links-grid">
                {links.map((link, index) => {
                    const IconComponent = ICON_MAP[link.icon] || ExternalLink;

                    return (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="quick-link-item"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className={`quick-link-icon-wrapper`}>
                                <IconComponent size={28} strokeWidth={1.5} />
                            </div>
                            <span className="quick-link-label">{link.name}</span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
