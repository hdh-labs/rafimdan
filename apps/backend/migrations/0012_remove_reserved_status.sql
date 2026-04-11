-- Rezerve durumunu kaldır: reserved ilanlar active'e çekiliyor
UPDATE listings SET status = 'active' WHERE status = 'reserved';
