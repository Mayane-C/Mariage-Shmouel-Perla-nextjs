'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Bloc d'invitation formel en hébreu — coutume placée en tout début
 * d'invitation. Layout centré RTL, typographie FrankRuhlLibre,
 * paragraphes espacés, gras sur les prénoms des mariés.
 *
 * Animation d'apparition : même pattern que FairePart (spring sur mobile,
 * fade+translate en CSS sur desktop). Placé avant FairePart et partageant
 * le transition-delay 0s → les deux apparaissent en simultané.
 */
export function InvitationFormalHebrew() {
  const [isMobile, setIsMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (document.body.classList.contains('revealed')) {
      setRevealed(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('revealed')) {
        setRevealed(true);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Même modèle que l'ancien FairePart :
  //  - Desktop : useSpring=false → CSS .block prend la main
  //    (translateY 340px → 0, 1.6 s cubic-bezier 0.25, 0.1, 0.25, 1)
  //  - Mobile  : useSpring=true → framer-motion spring critiquement amorti
  //    (stiffness 40, damping 12, mass 1) y:600 → 0
  const useSpring = isMobile && !prefersReducedMotion;

  const springVariants = {
    hidden: { opacity: 0, y: 600 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        // Spring plus lent et plus lourd que l'ancien FairePart pour un
        // arrivée moins soudaine (le bloc hébreu est le PREMIER visible
        // après l'intro vidéo — il mérite une entrée qui laisse respirer).
        type: 'spring' as const,
        stiffness: 22,
        damping: 14,
        mass: 1.4,
        opacity: { duration: 1.8, ease: 'easeOut' as const },
      },
    },
  };

  return (
    <motion.section
      className="invitation-formal-he block"
      dir="rtl"
      data-spring={useSpring ? 'on' : 'off'}
      initial={useSpring ? 'hidden' : undefined}
      animate={useSpring ? (revealed ? 'visible' : 'hidden') : undefined}
      variants={useSpring ? springVariants : undefined}
    >
      <p className="ifh-bsd">בס״ד</p>

      <div className="ifh-para">
        <p>אנו מודים לד׳ על כל הטוב אשר גמלנו, ובחסדו הגדול</p>
        <p>
          זיכנו בנישואי צאצאינו החתן <strong>שמואל</strong> שי׳
        </p>
        <p>
          עב״ג הכלה המהוללה מ׳ <strong>פערלא</strong> תחי׳
        </p>
      </div>

      <div className="ifh-para">
        <p>החופה והסעודת מצוה תהיה בעז״ה ליום ה׳ כ״א אלול תשפ״ו,</p>
        <p>הבא עלינו ועל כל ישראל לטובה ולברכה,</p>
        <p>באולם בקרה אשר בעיר בובני - צרפת עי״א,</p>
        <p>בשעה החמישית*, בשעה טובה ומוצלחת.</p>
      </div>

      <div className="ifh-para">
        <p>בשמחה זו טוב לבב לנקוט לידידינו ומכירינו, אשר יואילו נא</p>
        <p>לשמוח אתנו יחדיו, ביום שמחת לבבנו, ולברך את</p>
        <p>הזוג הצעיר וכולנו, בברכת מז״ט, וחיים מאושרים</p>
        <p>בגשמיות וברוחניות.</p>
      </div>

      <div className="ifh-para">
        <p>הא-ל הטוב, הוא יתברך, יברך את דרכם, הוא ישרה אושר וברכה בביתם</p>
        <p>בתוך כלל אחב״י, ויחיו באחדות מופלאה מהיום ועד בשר.</p>
      </div>

      <p className="ifh-signature">מוקירים ומכבדיהם</p>

      <div className="ifh-parents">
        <div className="ifh-parents-col">
          <p className="ifh-parents-label">הורי החתן</p>
          <p className="ifh-parents-name">ר׳ מסעוד ורעיתו ז״ל סמדג׳ה</p>
        </div>
        <div className="ifh-parents-col">
          <p className="ifh-parents-label">הורי הכלה</p>
          <p className="ifh-parents-name">ר׳ מנשה ורעייתו שוקרון</p>
        </div>
      </div>

      <p className="ifh-footnote">
        * קבלת פנים בשעה 17:00 · והחופה בשעה 18:00
      </p>
    </motion.section>
  );
}
