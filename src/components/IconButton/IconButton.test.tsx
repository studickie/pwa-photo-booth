import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import IconButton from './IconButton';

describe('IconButton', () => {

    it('Uses the "label" prop to set the "aria-label" attribute', () => {
        render(IconButton({ label: 'MyLabel', icon: 'home', isDisabled: false, onClick: vi.fn() }));
        const button = screen.getByLabelText('MyLabel');
        expect(button).toBeTruthy();
    });

    it('Users the "icon" prop to set the icon name', () => {
        render(IconButton({ label: 'MyLabel', icon: 'home', isDisabled: false, onClick: vi.fn() }));
        const iconSpan = screen.getByTestId('icon-button-icon');
        expect(iconSpan).toHaveTextContent('home');
    });
    
    it('Uses the "disabled" prop to set disabled status', () => {
        render(IconButton({ label: 'MyLabel', icon: 'home', isDisabled: true, onClick: vi.fn() }));
        const button = screen.getByLabelText('MyLabel');
        expect(button).toBeDisabled();
    });

    it('Calls the provided "onClick" handler when clicked', async () => {
        const mockHandler = vi.fn();
        render(IconButton({ label: 'MyLabel', icon: 'home', isDisabled: false, onClick: mockHandler }));
        const button = screen.getByLabelText('MyLabel');
        await act(async () => await userEvent.click(button));
        expect(mockHandler).toHaveBeenCalledTimes(1);
        mockHandler.mockClear();
    });

    it('Does not call "onClick" handler when clicked while disabled', async () => {
        const mockHandler = vi.fn();
        render(IconButton({ label: 'MyLabel', icon: 'home', isDisabled: true, onClick: mockHandler }));
        const button = screen.getByLabelText('MyLabel');
        await act(async () => await userEvent.click(button));
        expect(mockHandler).toHaveBeenCalledTimes(0);
        mockHandler.mockClear();
    });
});