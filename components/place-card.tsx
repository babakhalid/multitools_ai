/* eslint-disable @next/next/no-img-element */
"use client"; // Add if needed, depends on usage context

import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { cn } from "@/lib/utils"; // Ensure this path is correct
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    MapPin, Star, ExternalLink, Navigation, Globe, Phone, ChevronDown, ChevronUp,
    Clock
} from 'lucide-react';

// --- Interfaces ---
interface Location {
    lat: number;
    lng: number;
}

interface Photo {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
    caption?: string;
}

export interface Place { // Export Place interface if used elsewhere
    name: string;
    location: Location;
    place_id: string;
    vicinity: string;
    rating?: number;
    reviews_count?: number;
    price_level?: string;
    description?: string;
    photos?: Photo[];
    is_closed?: boolean;
    next_open_close?: string;
    type?: string;
    cuisine?: string;
    source?: string;
    phone?: string;
    website?: string;
    hours?: string[];
    distance?: number;
    bearing?: string;
    timezone?: string;
}

interface PlaceCardProps {
    place: Place;
    onClick: () => void;
    isSelected?: boolean;
    variant?: 'overlay' | 'list';
}

// --- HoursSection Component ---
const HoursSection: React.FC<{ hours: string[]; timezone?: string }> = ({ hours, timezone }) => {
    const [isOpen, setIsOpen] = useState(false);
    const now = timezone ?
        DateTime.now().setZone(timezone) :
        DateTime.now();
    const currentDay = now.weekdayLong;

    if (!hours?.length) return null;

    const todayHours = hours.find(h => h.startsWith(currentDay!))?.split(': ')[1] || 'Closed';

    return (
        <div className="mt-4 border-t dark:border-neutral-800 pt-4"> {/* Added pt-4 */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={cn(
                    "flex items-center gap-2 cursor-pointer transition-colors",
                    "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
            >
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Today: <span className="font-medium text-neutral-900 dark:text-neutral-100">{todayHours}</span></span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={isOpen ? "Hide hours" : "Show hours"} // Accessibility
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="ml-auto p-0 h-8 w-8 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Collapsible Section */}
            <div className={cn(
                "grid transition-all duration-300 ease-in-out overflow-hidden",
                isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0" // Smooth transition
            )}>
                <div className="min-h-0"> {/* Needed for grid transition */}
                    <div className="rounded-md border dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        {hours.map((timeSlot, idx) => {
                            const [day, hoursText] = timeSlot.split(': '); // Renamed variable
                            const isToday = day === currentDay;

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center justify-between py-2 px-3 text-sm", // Removed rounded-md from inner items
                                        isToday ? "bg-white dark:bg-neutral-800" : "" // Apply bg only if today
                                    )}
                                >
                                    <span className={cn(
                                        "font-medium",
                                        isToday ? "text-primary" : "text-neutral-600 dark:text-neutral-400"
                                    )}>
                                        {day}
                                    </span>
                                    <span className={cn(
                                        "text-right", // Ensure right alignment
                                        isToday ? "font-medium" : "text-neutral-600 dark:text-neutral-400"
                                    )}>
                                        {hoursText}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- PlaceCard Component ---
const PlaceCard: React.FC<PlaceCardProps> = ({
    place,
    onClick,
    isSelected = false,
    variant = 'list'
}) => {
    // Removed unused showHours state

    const isOverlay = variant === 'overlay';

    const formatTime = (timeStr: string | undefined, timezone: string | undefined): string => {
        if (!timeStr || !timezone) return '';
        const hours = Math.floor(parseInt(timeStr) / 100);
        const minutes = parseInt(timeStr) % 100;
        try {
            return DateTime.now()
                .setZone(timezone)
                .set({ hour: hours, minute: minutes })
                .toFormat('h:mm a');
        } catch (error) {
            console.warn(`Error formatting time with timezone ${timezone}:`, error);
            // Fallback to local time format if timezone is invalid
             return DateTime.now()
                .set({ hour: hours, minute: minutes })
                .toFormat('h:mm a');
        }
    };

    const getStatusDisplay = (): { text: string; color: string } | null => {
         if (place.is_closed === undefined || !place.next_open_close) {
            return null;
        }

        const timeStr = formatTime(place.next_open_close, place.timezone);
        if (!timeStr) return null; // If time formatting failed

        if (place.is_closed) {
            return {
                text: `Closed · Opens ${timeStr}`,
                color: 'text-red-600 dark:text-red-400' // Direct class
            };
        }
        return {
            text: `Open · Closes ${timeStr}`,
            color: 'text-green-600 dark:text-green-400' // Direct class
        };
    };

    const statusDisplay = getStatusDisplay();

    const cardContent = (
        <>
            <div className="flex gap-3 text-sm">
                {/* Image with Price Badge */}
                {place.photos?.[0]?.medium && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"> {/* Added bg */}
                        <img
                            src={place.photos[0].medium}
                            alt={place.name}
                            className="w-full h-full object-cover"
                            loading="lazy" // Add lazy loading
                        />
                        {place.price_level && (
                            <Badge
                                variant="secondary"
                                className="absolute top-1 left-1 bg-black/70 text-white border-none text-xs h-auto px-1.5 py-0.5 rounded" // Ensure rounded
                            >
                                {place.price_level}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                     {/* Name, Rating, Status, Address */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1"> {/* Added space-y-1 */}
                            <h3 className="font-semibold truncate text-base text-neutral-900 dark:text-neutral-100">
                                {place.name}
                            </h3>

                            {place.rating !== undefined && place.rating !== null && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{place.rating.toFixed(1)}</span>
                                    {place.reviews_count !== undefined && place.reviews_count !== null && (
                                        <span className="text-neutral-500 dark:text-neutral-400">({place.reviews_count})</span>
                                    )}
                                </div>
                            )}

                            {statusDisplay && (
                                <div className={cn("text-sm font-medium", statusDisplay.color)}>
                                    {statusDisplay.text}
                                </div>
                            )}

                            {place.vicinity && (
                                <div className="flex items-start text-sm text-neutral-600 dark:text-neutral-400"> {/* Changed to items-start */}
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" /> {/* Adjusted margin/alignment */}
                                    <span>{place.vicinity}</span> {/* Removed truncate, let flexbox handle wrap */}
                                </div>
                            )}
                        </div>
                         {/* Maybe an icon or something else on the right? Kept structure */}
                    </div>

                     {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-3 text-xs sm:text-sm" // Responsive text size
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}`,
                                    '_blank'
                                );
                            }}
                        >
                            <Navigation className="w-3.5 h-3.5 mr-1.5" />
                            Directions
                        </Button>

                        {place.phone && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs sm:text-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${place.phone}`, '_blank');
                                }}
                            >
                                <Phone className="w-3.5 h-3.5 mr-1.5" />
                                Call
                            </Button>
                        )}

                        {place.website && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs sm:text-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(place.website, '_blank');
                                }}
                            >
                                <Globe className="w-3.5 h-3.5 mr-1.5" />
                                Website
                            </Button>
                        )}

                        {place.place_id && !isOverlay && place.source !== 'google' && ( // Show only if not Google source or use GMaps link
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs sm:text-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Use Google Maps Place ID for more info link
                                    window.open(`https://www.google.com/maps/place/?q=place_id:${place.place_id}`, '_blank');
                                }}
                            >
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                More Info
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Hours Section */}
            {place.hours && place.hours.length > 0 && (
                <HoursSection hours={place.hours} timezone={place.timezone} />
            )}
        </>
    );

    if (isOverlay) {
        return (
            <div
                className="bg-white/95 dark:bg-black/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm w-full" // Ensure width
                onClick={onClick}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <Card
            onClick={onClick}
            className={cn(
                "w-full transition-all duration-200 cursor-pointer p-4",
                "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800", // Base styles
                "hover:bg-neutral-50 dark:hover:bg-neutral-800", // Hover styles
                isSelected
                    ? "ring-2 ring-primary dark:ring-offset-black ring-offset-2 ring-offset-white" // Selected styles
                    : "shadow-sm", // Default shadow
                !isSelected && "hover:shadow-md" // Hover shadow when not selected
            )}
            aria-selected={isSelected} // Accessibility
        >
            {cardContent}
        </Card>
    );
};

export default PlaceCard;