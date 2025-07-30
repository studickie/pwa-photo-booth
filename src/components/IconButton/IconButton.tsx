import './iconButton.module.css';

interface Props {
    icon: string;
    label: string;
    isDisabled: boolean;
    onClick: (e: React.MouseEvent) => unknown;
};

function IconButton({ icon, label, isDisabled = false, onClick }: Props) {
    return (
        <button className='icon-button'
            onClick={(e) => onClick(e)}
            aria-label={label}
            disabled={isDisabled}>
            <span className='material-symbols-rounded' aria-hidden='true' data-testId='icon-button-icon'>
                {icon}
            </span>
        </button>
    );
}

export default IconButton;