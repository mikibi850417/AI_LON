import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.section}>
            <h4>주식회사 인텔리전트론 (Intelligent L.O.N Inc)</h4>
            <p>대표이사: 이상훈 (SangHun Lee)</p>
            <p>사업자등록번호: 826‑81‑03432</p>
            <p>(07983) 서울특별시 양천구 지양로 11길 14‑2, 302호</p>
          </div>
          <div className={styles.section}>
            <h4>고객센터</h4>
            <p>전화: 02‑XXXX‑XXXX</p>
            <p>이메일: lon@intelligentlon.com</p>
            <p>평일 09:00 - 18:00</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2024 Intelligent L.O.N Inc. All rights reserved.
          </p>
          <div className={styles.legalInfo}>
            <small>
              법인등록번호: 110111‑9130115 | 
              업태: 정보통신업 / 전문 · 과학 및 기술서비스업 |
              업종: 소프트웨어 개발 및 공급업, 웹사이트 제작·판매·임대업, 경영컨설팅업
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
} 