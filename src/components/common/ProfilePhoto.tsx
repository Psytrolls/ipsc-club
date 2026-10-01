import React,{useState} from 'react';import {User} from '../../types';import {api,useApp} from '../../context/AppContext';
export const ProfilePhoto: React.FC<{ user: User; editable?: boolean; darkTheme?: boolean }> = ({
  user,
  editable = false,
  darkTheme = false,
}) => {
  const { refresh, showToast } = useApp();
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showToast('בחרו תמונת JPG, PNG או WebP עד 10MB', 'error');
      return;
    }
    setBusy(true);
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const side = Math.min(img.width, img.height);
      canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
      img.close();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.8));
      if (!blob || blob.size > 65000) throw Error('התמונה גדולה מדי. נסו תמונה אחרת.');
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      await api('/users/' + encodeURIComponent(user.id) + '/photo', 'POST', { image: data, mime: blob.type });
      await refresh();
      showToast('התמונה עודכנה בהצלחה', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'לא ניתן להעלות את התמונה', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-falcon-600 text-white flex items-center justify-center text-2xl font-bold shadow-md border-2 border-[#DFCEB0]">
        {user.avatarVersion ? (
          <img
            className="w-full h-full object-cover"
            alt={'תמונת פרופיל של ' + user.fullName}
            src={'/api/users/' + encodeURIComponent(user.id) + '/photo?v=' + user.avatarVersion}
          />
        ) : (
          user.fullName.charAt(0)
        )}
      </div>
      {editable && (
        <div className="flex flex-col gap-1.5 w-full">
          <label
            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-center cursor-pointer transition-all shadow-sm flex items-center justify-center ${
              darkTheme
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
                : 'bg-white hover:bg-[#FAF8F5] text-graphite-900 border border-[#DFCEB0]'
            }`}
          >
            {busy ? 'מעלה…' : 'שינוי תמונה'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={e => {
                upload(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {user.avatarVersion && (
            <button
              type="button"
              className={`text-[11px] font-semibold underline text-center transition-colors ${
                darkTheme ? 'text-rose-300 hover:text-rose-200' : 'text-rose-600 hover:text-rose-800'
              }`}
              disabled={busy}
              onClick={async () => {
                try {
                  await api('/users/' + encodeURIComponent(user.id) + '/photo', 'DELETE', {});
                  await refresh();
                  showToast('התמונה הוסרה', 'info');
                } catch {
                  showToast('מחיקת התמונה נכשלה', 'error');
                }
              }}
            >
              הסרת תמונה
            </button>
          )}
        </div>
      )}
    </div>
  );
};
